<?php

namespace Tests\Feature;

use App\Models\ProjectPriority;
use App\Models\ProjectStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_default_project_statuses_and_priorities_seeded_from_screenshot_options(): void
    {
        // 1. Verify screenshot 1 project status values
        $expectedStatuses = [
            'Not Started',
            'In Progress',
            'On Hold',
            'Completed',
            'Cancelled',
        ];

        foreach ($expectedStatuses as $statusName) {
            $this->assertDatabaseHas('project_statuses', [
                'name' => $statusName,
                'is_delete' => false,
            ]);
        }

        // 2. Verify screenshot 2 project priority values
        $expectedPriorities = [
            'Low Priority',
            'Medium Priority',
            'High Priority',
            'Urgent Priority',
        ];

        foreach ($expectedPriorities as $priorityName) {
            $this->assertDatabaseHas('project_priorities', [
                'name' => $priorityName,
                'is_delete' => false,
            ]);
        }
    }

    public function test_get_project_statuses_returns_strictly_active_records_is_delete_equals_zero(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // Create an active custom status
        $activeStatus = ProjectStatus::create([
            'name' => 'Under Legal Review',
            'order_column' => 10,
            'is_delete' => false,
        ]);

        // Create a soft-deleted status (is_delete = 1)
        $deletedStatus = ProjectStatus::create([
            'name' => 'Archived Status',
            'order_column' => 99,
            'is_delete' => true,
        ]);

        // 1. GET /api/v1/project-statuses
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-statuses');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'order_column',
                        'is_delete',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        // Every returned record must have is_delete = false (0)
        foreach ($data as $item) {
            $this->assertFalse((bool) $item['is_delete'], "Status {$item['id']} has is_delete = 1");
        }

        $ids = collect($data)->pluck('id')->toArray();
        $this->assertContains($activeStatus->id, $ids);
        $this->assertNotContains($deletedStatus->id, $ids);

        // 2. GET /api/v1/projects/statuses alias
        $aliasResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/projects/statuses');
        $aliasResponse->assertStatus(200);
        $aliasIds = collect($aliasResponse->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeStatus->id, $aliasIds);
        $this->assertNotContains($deletedStatus->id, $aliasIds);
    }

    public function test_get_project_status_by_id_returns_active_or_404_if_deleted(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $status = ProjectStatus::where('is_delete', false)->first();

        // Active status returns 200
        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-statuses/{$status->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.id', $status->id)
            ->assertJsonPath('data.name', $status->name)
            ->assertJsonPath('data.is_delete', false);

        // Soft-delete status
        $status->logicalDelete();

        // Querying deleted status returns 404
        $deletedResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-statuses/{$status->id}");
        $deletedResponse->assertStatus(404);
    }

    public function test_get_project_priorities_returns_strictly_active_records_is_delete_equals_zero(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // Create an active custom priority
        $activePriority = ProjectPriority::create([
            'name' => 'Blocker Priority',
            'order_column' => 10,
            'is_delete' => false,
        ]);

        // Create a soft-deleted priority (is_delete = 1)
        $deletedPriority = ProjectPriority::create([
            'name' => 'Obsolete Priority',
            'order_column' => 99,
            'is_delete' => true,
        ]);

        // 1. GET /api/v1/project-priorities
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-priorities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'order_column',
                        'is_delete',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        // Every returned record must have is_delete = false (0)
        foreach ($data as $item) {
            $this->assertFalse((bool) $item['is_delete'], "Priority {$item['id']} has is_delete = 1");
        }

        $ids = collect($data)->pluck('id')->toArray();
        $this->assertContains($activePriority->id, $ids);
        $this->assertNotContains($deletedPriority->id, $ids);

        // 2. GET /api/v1/projects/priorities alias
        $aliasResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/projects/priorities');
        $aliasResponse->assertStatus(200);
        $aliasIds = collect($aliasResponse->json('data'))->pluck('id')->toArray();
        $this->assertContains($activePriority->id, $aliasIds);
        $this->assertNotContains($deletedPriority->id, $aliasIds);
    }

    public function test_get_project_priority_by_id_returns_active_or_404_if_deleted(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $priority = ProjectPriority::where('is_delete', false)->first();

        // Active priority returns 200
        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-priorities/{$priority->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.id', $priority->id)
            ->assertJsonPath('data.name', $priority->name)
            ->assertJsonPath('data.is_delete', false);

        // Soft-delete priority
        $priority->logicalDelete();

        // Querying deleted priority returns 404
        $deletedResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-priorities/{$priority->id}");
        $deletedResponse->assertStatus(404);
    }

    public function test_soft_delete_project_status_and_priority_sets_is_delete_one_and_excludes_from_get(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $status = ProjectStatus::where('is_delete', false)->first();
        $priority = ProjectPriority::where('is_delete', false)->first();

        // 1. Delete status via DELETE /api/v1/project-statuses/{id}
        $deleteStatusRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/project-statuses/{$status->id}");
        $deleteStatusRes->assertStatus(200);

        // Check is_delete in DB
        $this->assertDatabaseHas('project_statuses', [
            'id' => $status->id,
            'is_delete' => true,
        ]);

        // GET single returns 404
        $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-statuses/{$status->id}")->assertStatus(404);

        // 2. Delete priority via DELETE /api/v1/project-priorities/{id}
        $deletePriorityRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/project-priorities/{$priority->id}");
        $deletePriorityRes->assertStatus(200);

        // Check is_delete in DB
        $this->assertDatabaseHas('project_priorities', [
            'id' => $priority->id,
            'is_delete' => true,
        ]);

        // GET single returns 404
        $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-priorities/{$priority->id}")->assertStatus(404);
    }

    public function test_delivery_statuses_and_priority_names_endpoints_return_active_arrays(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // Delivery statuses array
        $resStatuses = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-statuses/delivery');
        $resStatuses->assertStatus(200);
        $statuses = $resStatuses->json('data');
        $this->assertContains('Not Started', $statuses);
        $this->assertContains('In Progress', $statuses);
        $this->assertContains('On Hold', $statuses);
        $this->assertContains('Completed', $statuses);
        $this->assertContains('Cancelled', $statuses);

        // Priority names array
        $resPriorities = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-priorities/names');
        $resPriorities->assertStatus(200);
        $priorities = $resPriorities->json('data');
        $this->assertContains('Low Priority', $priorities);
        $this->assertContains('Medium Priority', $priorities);
        $this->assertContains('High Priority', $priorities);
        $this->assertContains('Urgent Priority', $priorities);
    }

    public function test_pipeline_stages_still_available_via_project_stages_endpoint(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-stages');
        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('Planning', $names);
        $this->assertContains('Testing & QA', $names);
    }
}
