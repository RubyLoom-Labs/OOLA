<?php

namespace Tests\Feature;

use App\Mail\PasswordResetSuccessMail;
use App\Mail\UserInvitationMail;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class UserManagementAndAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Mail::fake();
    }

    public function test_admin_can_create_user_without_password_and_user_is_inactive(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $role = Role::first();

        $payload = [
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'role_id' => $role->id,
            'is_employee' => false,
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/users', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'John Doe')
            ->assertJsonPath('data.email', 'john.doe@example.com')
            ->assertJsonPath('data.role_id', $role->id)
            ->assertJsonPath('data.status', 'Inactive');

        $user = User::where('email', 'john.doe@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Inactive', $user->status);

        // Verify token in password_reset_tokens table
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'john.doe@example.com',
        ]);

        // Verify invitation email sent
        Mail::assertSent(UserInvitationMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email) && str_contains($mail->resetUrl, 'email=john.doe%40example.com');
        });

        // Verify Inactive user CANNOT login
        $loginAttempt = $this->postJson('/api/v1/auth/login', [
            'email' => 'john.doe@example.com',
            'password' => 'someRandomPassword123',
        ]);
        $loginAttempt->assertStatus(422); // Credential check fails or deactivation
    }

    public function test_inactive_user_with_valid_password_is_blocked_with_403(): void
    {
        $user = User::create([
            'name' => 'Inactive Guy',
            'email' => 'inactive@test.com',
            'password' => Hash::make('password123'),
            'status' => 'Inactive',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Your account is inactive. Please set up your password via the invitation email or contact an administrator.');
    }

    public function test_deleted_user_cannot_login(): void
    {
        $user = User::create([
            'name' => 'Deleted Guy',
            'email' => 'deleted@test.com',
            'password' => Hash::make('password123'),
            'status' => 'Active',
            'is_delete' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'deleted@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_set_password_via_reset_token_and_becomes_active(): void
    {
        $user = User::create([
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => Hash::make('temp-random-hash'),
            'status' => 'Inactive',
        ]);

        $plainToken = 'test-token-1234567890123456789012345678901234567890';
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($plainToken),
            'created_at' => now(),
        ]);

        // Submit new password
        $resetResponse = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'newuser@example.com',
            'token' => $plainToken,
            'password' => 'MyNewPassword123!',
            'password_confirmation' => 'MyNewPassword123!',
        ]);

        $resetResponse->assertStatus(200)
            ->assertJsonPath('message', 'Password updated successfully. Your account is now active and you can log in.');

        // Verify user is now active
        $user->refresh();
        $this->assertEquals('Active', $user->status);
        $this->assertTrue(Hash::check('MyNewPassword123!', $user->password));

        // Verify token deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'newuser@example.com',
        ]);

        // Verify success email sent
        Mail::assertSent(PasswordResetSuccessMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });

        // Now user CAN log in!
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'newuser@example.com',
            'password' => 'MyNewPassword123!',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_forgot_password_sends_email(): void
    {
        $user = User::create([
            'name' => 'Forgot Password User',
            'email' => 'forgot@example.com',
            'password' => Hash::make('password123'),
            'status' => 'Active',
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'forgot@example.com',
        ]);

        $response->assertStatus(200);

        Mail::assertSent(UserInvitationMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email) && ! $mail->isNewUser;
        });
    }

    public function test_admin_can_resend_invite_to_user(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $user = User::create([
            'name' => 'Pending Guy',
            'email' => 'pending@example.com',
            'password' => Hash::make('temp'),
            'status' => 'Inactive',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/users/{$user->id}/resend-invite");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Password setup invitation link has been resent to pending@example.com.');

        Mail::assertSent(UserInvitationMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_user_index_can_filter_by_status(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        User::create([
            'name' => 'Inactive Filter User',
            'email' => 'filter.inactive@test.com',
            'password' => Hash::make('password'),
            'status' => 'Inactive',
        ]);

        $responseActive = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/users?status=Active');
        $responseActive->assertStatus(200);
        $activeEmails = collect($responseActive->json('data'))->pluck('email')->toArray();
        $this->assertNotContains('filter.inactive@test.com', $activeEmails);

        $responseInactive = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/users?status=Inactive');
        $responseInactive->assertStatus(200);
        $inactiveEmails = collect($responseInactive->json('data'))->pluck('email')->toArray();
        $this->assertContains('filter.inactive@test.com', $inactiveEmails);
    }

    public function test_users_employees_endpoint_returns_only_active_employees_with_pagination(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // Active employee
        User::create([
            'name' => 'Active Employee Test',
            'email' => 'active.emp@test.com',
            'password' => Hash::make('password'),
            'status' => 'Active',
            'is_employee' => true,
        ]);

        // Inactive employee (should NOT be returned)
        User::create([
            'name' => 'Inactive Employee Test',
            'email' => 'inactive.emp@test.com',
            'password' => Hash::make('password'),
            'status' => 'Inactive',
            'is_employee' => true,
        ]);

        // Active non-employee (should NOT be returned)
        User::create([
            'name' => 'Active Non-Employee Test',
            'email' => 'active.nonemp@test.com',
            'password' => Hash::make('password'),
            'status' => 'Active',
            'is_employee' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/users/employees?page=1&per_page=20');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'status',
                        'role_id',
                        'is_employee',
                    ],
                ],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'to', 'total'],
            ]);

        $emails = collect($response->json('data'))->pluck('email')->toArray();

        // Must contain active employees
        $this->assertContains('active.emp@test.com', $emails);
        $this->assertContains('mary@ooralabz.com', $emails);

        // Must NOT contain inactive employees or non-employees
        $this->assertNotContains('inactive.emp@test.com', $emails);
        $this->assertNotContains('active.nonemp@test.com', $emails);
        $this->assertNotContains('admin@ooralabz.com', $emails);

        // Alias endpoint /api/v1/users/active-employees behaves identically
        $aliasResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/users/active-employees?page=1&per_page=20');
        $aliasResponse->assertStatus(200);
        $aliasEmails = collect($aliasResponse->json('data'))->pluck('email')->toArray();
        $this->assertEquals($emails, $aliasEmails);

        // Query params /api/v1/users?status=Active&is_employee=true behaves identically
        $filterResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/users?page=1&per_page=20&status=Active&is_employee=true');
        $filterResponse->assertStatus(200);
        $filterEmails = collect($filterResponse->json('data'))->pluck('email')->toArray();
        $this->assertEquals($emails, $filterEmails);
    }
}
