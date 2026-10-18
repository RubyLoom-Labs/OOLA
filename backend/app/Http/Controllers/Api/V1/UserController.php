<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Mail\UserInvitationMail;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::with('roles');

        // Optional filter by status (Active / Inactive)
        if ($request->has('status') && $request->input('status') !== null && $request->input('status') !== '') {
            $status = $request->input('status');
            if ($status === '1' || $status === 1 || $status === true || strtolower($status) === 'active') {
                $query->whereIn('status', ['Active', '1']);
            } elseif ($status === '0' || $status === 0 || $status === false || strtolower($status) === 'inactive') {
                $query->whereIn('status', ['Inactive', '0']);
            } else {
                $query->where('status', $status);
            }
        }

        // Optional search by name, email, phone, role, or department
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 0);
        $users = $perPage > 0 ? $query->latest()->paginate($perPage) : $query->latest()->get();

        return UserResource::collection($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ]);

        $roleIds = $validated['role_ids'] ?? [];
        unset($validated['role_ids']);

        // User cannot manually enter password. Account starts Inactive with a secure random hash.
        $validated['password'] = Hash::make(Str::random(32));
        $validated['status'] = 'Inactive';

        $user = User::create($validated);

        if (! empty($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        // Generate password setup token and dispatch invitation email
        $token = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        $resetUrl = rtrim($frontendUrl, '/').'/reset-password?token='.$token.'&email='.urlencode($user->email);

        try {
            Mail::to($user->email)->send(new UserInvitationMail($user, $resetUrl, true));
        } catch (\Throwable $e) {
            report($e);
        }

        ActivityLogger::log('User Created', "Created user: {$user->name} ({$user->email}) - Invitation email sent", $user);

        return (new UserResource($user->load('roles')))->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('roles.permissions'));
    }

    public function update(Request $request, User $user): UserResource
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:Active,Inactive,0,1'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === '1') {
                $validated['status'] = 'Active';
            } elseif ($validated['status'] === '0') {
                $validated['status'] = 'Inactive';
            }
        }

        $roleIds = null;
        if (array_key_exists('role_ids', $validated)) {
            $roleIds = $validated['role_ids'];
            unset($validated['role_ids']);
        }

        $user->update($validated);

        if ($roleIds !== null) {
            $user->roles()->sync($roleIds);
        }

        ActivityLogger::log('User Updated', "Updated user: {$user->name} ({$user->email})", $user);

        return new UserResource($user->load('roles'));
    }

    public function resendInvite(int|string $id): JsonResponse
    {
        $user = User::withoutGlobalScopes()->findOrFail($id);

        if ((bool) $user->is_delete) {
            return response()->json(['message' => 'Cannot send invitation to a deleted user.'], 422);
        }

        $token = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        $resetUrl = rtrim($frontendUrl, '/').'/reset-password?token='.$token.'&email='.urlencode($user->email);

        try {
            Mail::to($user->email)->send(new UserInvitationMail($user, $resetUrl, false));
        } catch (\Throwable $e) {
            report($e);
        }

        ActivityLogger::log('Invitation Resent', "Resent password setup link to {$user->email}", $user);

        return response()->json([
            'message' => "Password setup invitation link has been resent to {$user->email}.",
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->logicalDelete();
        ActivityLogger::log('User Deactivated', "Deactivated user: {$user->name}", $user);

        return response()->json(['message' => 'User deactivated successfully.']);
    }
}
