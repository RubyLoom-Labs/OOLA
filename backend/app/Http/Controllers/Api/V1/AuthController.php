<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetSuccessMail;
use App\Mail\UserInvitationMail;
use App\Models\User;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::withoutGlobalScopes()
            ->with('roles.permissions')
            ->where('email', $request->email)
            ->first();

        if (! $user || (bool) $user->is_delete || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if (! in_array($user->status, ['Active', '1', 1, true], true)) {
            return response()->json([
                'message' => 'Your account is inactive. Please set up your password via the invitation email or contact an administrator.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLogger::log('User Login', "User {$user->name} logged in", $user);

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::withoutGlobalScopes()->where('email', $validated['email'])->first();

        if (! $user || (bool) $user->is_delete) {
            return response()->json([
                'message' => 'If this email is registered in our system, a password reset link has been sent.',
            ]);
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

        ActivityLogger::log('Password Reset Requested', "Password reset requested for {$user->email}", $user);

        return response()->json([
            'message' => 'If this email is registered in our system, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $resetRecord || ! Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
            ], 422);
        }

        if (Carbon::parse($resetRecord->created_at)->addHours(24)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'message' => 'This password reset link has expired. Please request a new one.',
            ], 422);
        }

        $user = User::withoutGlobalScopes()->where('email', $request->email)->first();

        if (! $user || (bool) $user->is_delete) {
            return response()->json([
                'message' => 'User account not found or has been removed.',
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->status = 'Active';
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        $loginUrl = rtrim($frontendUrl, '/').'/login';

        try {
            Mail::to($user->email)->send(new PasswordResetSuccessMail($user, $loginUrl));
        } catch (\Throwable $e) {
            report($e);
        }

        ActivityLogger::log('Password Updated', "User {$user->name} successfully updated password", $user);

        return response()->json([
            'message' => 'Password updated successfully. Your account is now active and you can log in.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles.permissions');

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        ActivityLogger::log('User Logout', "User {$request->user()->name} logged out", $request->user());

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        ActivityLogger::log('Profile Updated', "User {$user->name} updated profile", $user);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user),
        ]);
    }
}
