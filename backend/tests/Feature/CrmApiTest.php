<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\LeadStage;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_login_and_receive_sanctum_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@ooralabz.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ]);
    }

    public function test_authenticated_user_can_fetch_dashboard(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'stats' => ['active_leads', 'active_projects', 'total_customers', 'pending_payments'],
                'today_tasks',
                'pipeline',
                'recent_activities',
            ]);
    }

    public function test_lead_kanban_and_stage_transitions(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $lead = Lead::first();
        $targetStage = LeadStage::where('slug', 'negotiation')->first();

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/leads/{$lead->id}/stage", [
            'lead_stage_id' => $targetStage->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.stage.slug', 'negotiation');
    }

    public function test_task_authoritative_server_timer(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $task = Task::first();

        // Start timer
        $startResponse = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/timer/start", [
            'notes' => 'Working on technical architecture proposal',
        ]);

        $startResponse->assertStatus(200)
            ->assertJsonPath('data.is_running', true);

        // Stop timer
        $stopResponse = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/timer/stop");

        $stopResponse->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => ['task_id', 'logged_duration_seconds', 'total_tracked_seconds'],
            ]);
    }

    public function test_logical_deletion_no_physical_delete(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $customer = Customer::create([
            'company_name' => 'Temporary Test Client Ltd',
            'email' => 'temp@test.com',
            'status' => 'Active',
        ]);

        $customerId = $customer->id;

        // Call delete endpoint
        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/customers/{$customerId}");
        $response->assertStatus(200);

        // Assert excluded from normal query
        $this->assertNull(Customer::find($customerId));

        // Assert physically still in DB with is_delete = true (PRD Section 2)
        $archived = Customer::withTrashed()->find($customerId);
        $this->assertNotNull($archived);
        $this->assertTrue($archived->is_delete);
        $this->assertNotNull($archived->deleted_at);
    }

    public function test_customer_multiple_phone_numbers_crud(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // 1. Create customer with multiple phone numbers
        $createResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/customers', [
            'company_name' => 'Multi Phone Corp',
            'email' => 'info@multiphone.com',
            'phone_numbers' => [
                ['phone_number' => '+94 11 111 2222', 'type' => 'Work', 'is_primary' => true, 'is_whatsapp' => false],
                ['phone_number' => '+94 77 333 4444', 'type' => 'WhatsApp', 'is_primary' => false, 'is_whatsapp' => true],
            ],
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonCount(2, 'data.phone_numbers');

        $customerId = $createResponse->json('data.id');

        // 2. Fetch customer details and verify phone numbers
        $showResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/customers/{$customerId}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.phone_numbers.0.phone_number', '+94 11 111 2222')
            ->assertJsonPath('data.phone_numbers.1.phone_number', '+94 77 333 4444');

        // 3. Update customer phone numbers
        $updateResponse = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/customers/{$customerId}", [
            'company_name' => 'Multi Phone Corp Updated',
            'phone_numbers' => [
                ['phone_number' => '+94 11 999 8888', 'type' => 'Direct', 'is_primary' => true],
            ],
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonCount(1, 'data.phone_numbers')
            ->assertJsonPath('data.phone_numbers.0.phone_number', '+94 11 999 8888');
    }
}
