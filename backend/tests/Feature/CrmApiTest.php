<?php

namespace Tests\Feature;

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
}
