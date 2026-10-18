<?php

namespace Tests\Feature;

use App\Models\ProjectStage;
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

    public function test_get_project_statuses_returns_records_with_is_delete_equals_zero(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // Create an active status
        $activeStatus = ProjectStage::create([
            'name' => 'Architecture Review',
            'slug' => 'architecture-review',
            'color' => '#8B5CF6',
            'order_column' => 5,
            'is_completed' => false,
            'is_delete' => false,
        ]);

        // Create a deleted status (is_delete = 1)
        $deletedStatus = ProjectStage::create([
            'name' => 'Deprecated Pipeline Stage',
            'slug' => 'deprecated-stage',
            'color' => '#EF4444',
            'order_column' => 99,
            'is_completed' => false,
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
                        'slug',
                        'color',
                        'order_column',
                        'is_completed',
                        'is_delete',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        // Every single returned record must have is_delete = false (0)
        foreach ($data as $item) {
            $this->assertFalse((bool) $item['is_delete'], "Record {$item['id']} should have is_delete = 0");
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

        // 3. GET /api/v1/project-stages
        $stagesResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-stages');
        $stagesResponse->assertStatus(200);
        $stageIds = collect($stagesResponse->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeStatus->id, $stageIds);
        $this->assertNotContains($deletedStatus->id, $stageIds);
    }

    public function test_get_project_status_by_id_returns_active_record(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $stage = ProjectStage::where('is_delete', false)->first();

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-statuses/{$stage->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $stage->id)
            ->assertJsonPath('data.name', $stage->name)
            ->assertJsonPath('data.is_delete', false);
    }

    public function test_get_project_delivery_statuses_returns_options_array(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-statuses/delivery');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'Not Started',
                    'In Progress',
                    'On Hold',
                    'Completed',
                    'Cancelled',
                ],
            ]);
    }
}
