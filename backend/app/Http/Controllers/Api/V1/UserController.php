<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Mail\UserInvitationMail;
use App\Models\Employee;
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
        $query = User::with(['role', 'employee']);

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

        // Optional filter by role_id
        if ($request->filled('role_id')) {
            $query->where('role_id', $request->input('role_id'));
        }

        // Optional filter by is_employee
        if ($request->has('is_employee') && $request->input('is_employee') !== null && $request->input('is_employee') !== '') {
            $query->where('is_employee', filter_var($request->input('is_employee'), FILTER_VALIDATE_BOOLEAN));
        }

        // Optional search by name, email, or role name
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('role', function ($rq) use ($search) {
                        $rq->where('name', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', $request->has('page') ? 20 : 0);
        $users = $perPage > 0 ? $query->latest()->paginate($perPage) : $query->latest()->get();

        return UserResource::collection($users);
    }

    /**
     * Get active users who are employees only.
     */
    public function employees(Request $request): AnonymousResourceCollection
    {
        $request->merge([
            'status' => 'Active',
            'is_employee' => true,
        ]);

        return $this->index($request);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'is_employee' => ['nullable', 'boolean'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        if (! empty($validated['employee_id']) && ! isset($validated['is_employee'])) {
            $validated['is_employee'] = true;
        }

        // User cannot manually enter password. Account starts Inactive with a secure random hash.
        $validated['password'] = Hash::make(Str::random(32));
        $validated['status'] = 'Inactive';

        $user = User::create($validated);

        if (! empty($validated['employee_id'])) {
            Employee::where('id', $validated['employee_id'])->update(['user_id' => $user->id]);
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

        return (new UserResource($user->load(['role', 'employee'])))->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load(['role.permissions', 'employee']));
    }

    public function update(Request $request, User $user): UserResource
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'role_id' => ['sometimes', 'required', 'integer', 'exists:roles,id'],
            'status' => ['nullable', 'string', 'in:Active,Inactive,0,1'],
            'is_employee' => ['sometimes', 'boolean'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === '1') {
                $validated['status'] = 'Active';
            } elseif ($validated['status'] === '0') {
                $validated['status'] = 'Inactive';
            }
        }

        if (! empty($validated['employee_id']) && ! isset($validated['is_employee'])) {
            $validated['is_employee'] = true;
        }

        $user->update($validated);

        if (! empty($validated['employee_id'])) {
            Employee::where('id', $validated['employee_id'])->update(['user_id' => $user->id]);
        }

        ActivityLogger::log('User Updated', "Updated user: {$user->name} ({$user->email})", $user);

        return new UserResource($user->load(['role', 'employee']));
    }

    public function resendInvite(int|string $id): JsonResponse
    {
        $user = User::findOrFail($id);

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
