<?php

namespace Tests\Feature;

use App\Models\Subtask;
use App\Models\Task;
use App\Models\TaskStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubtaskTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_list_subtasks_for_a_specific_task(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $stage = TaskStage::first();

        $task1 = Task::create([
            'title' => 'Task 1 - Backend API',
            'task_stage_id' => $stage->id,
            'status' => 'Pending',
        ]);

        $task2 = Task::create([
            'title' => 'Task 2 - Frontend UI',
            'task_stage_id' => $stage->id,
            'status' => 'Pending',
        ]);

        $subtask1 = Subtask::create([
            'task_id' => $task1->id,
            'title' => 'Implement Auth Controller',
            'order_column' => 1,
        ]);

        $subtask2 = Subtask::create([
            'task_id' => $task2->id,
            'title' => 'Create Figma UI Mockups',
            'order_column' => 1,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/tasks/{$task1->id}/subtasks");

        $response->assertStatus(200);
        $titles = collect($response->json('data'))->pluck('title')->toArray();
        $this->assertContains('Implement Auth Controller', $titles);
        $this->assertNotContains('Create Figma UI Mockups', $titles);
    }

    public function test_can_create_subtask_inside_a_task(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $stage = TaskStage::first();

        $task = Task::create([
            'title' => 'Deploy Kubernetes Cluster',
            'task_stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $payload = [
            'title' => 'Write Helm Chart values.yaml',
            'priority' => 'High',
            'stage' => 'To Do',
            'assigned_user_id' => $admin->id,
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/subtasks", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Write Helm Chart values.yaml')
            ->assertJsonPath('data.task_id', $task->id)
            ->assertJsonPath('data.priority', 'High')
            ->assertJsonPath('data.is_completed', false)
            ->assertJsonPath('data.order_column', 1);

        $subtaskId = $response->json('data.id');

        $this->assertDatabaseHas('subtasks', [
            'id' => $subtaskId,
            'task_id' => $task->id,
            'title' => 'Write Helm Chart values.yaml',
        ]);
    }

    public function test_subtask_access_verifies_it_belongs_to_task_before_operations(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $stage = TaskStage::first();

        $taskA = Task::create([
            'title' => 'Task A',
            'task_stage_id' => $stage->id,
            'status' => 'Pending',
        ]);

        $taskB = Task::create([
            'title' => 'Task B',
            'task_stage_id' => $stage->id,
            'status' => 'Pending',
        ]);

        $subtaskOfB = Subtask::create([
            'task_id' => $taskB->id,
            'title' => 'Subtask strictly belonging to Task B',
            'order_column' => 1,
        ]);

        // 1. Show subtask of Task B through Task A route must return 404
        $showRes = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/tasks/{$taskA->id}/subtasks/{$subtaskOfB->id}");
        $showRes->assertStatus(404)
            ->assertJsonPath('message', "Subtask #{$subtaskOfB->id} does not belong to Task #{$taskA->id}.");

        // 2. Update subtask of Task B through Task A route must return 404
        $updateRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/tasks/{$taskA->id}/subtasks/{$subtaskOfB->id}", [
            'title' => 'Attempted Cross-Task Overwrite',
        ]);
        $updateRes->assertStatus(404)
            ->assertJsonPath('message', "Subtask #{$subtaskOfB->id} does not belong to Task #{$taskA->id}.");

        // 3. Toggle subtask of Task B through Task A route must return 404
        $toggleRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$taskA->id}/subtasks/{$subtaskOfB->id}/toggle");
        $toggleRes->assertStatus(404)
            ->assertJsonPath('message', "Subtask #{$subtaskOfB->id} does not belong to Task #{$taskA->id}.");

        // 4. Delete subtask of Task B through Task A route must return 404
        $delRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/tasks/{$taskA->id}/subtasks/{$subtaskOfB->id}");
        $delRes->assertStatus(404)
            ->assertJsonPath('message', "Subtask #{$subtaskOfB->id} does not belong to Task #{$taskA->id}.");

        // 5. Accessing through its actual Task B succeeds
        $validRes = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/tasks/{$taskB->id}/subtasks/{$subtaskOfB->id}");
        $validRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Subtask strictly belonging to Task B');
    }

    public function test_can_update_toggle_and_delete_subtask(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $stage = TaskStage::first();

        $task = Task::create([
            'title' => 'Fullstack Feature',
            'task_stage_id' => $stage->id,
            'status' => 'Pending',
        ]);

        $subtask = Subtask::create([
            'task_id' => $task->id,
            'title' => 'Initial Subtask',
            'is_completed' => false,
            'stage' => 'To Do',
            'order_column' => 1,
        ]);

        // Update
        $updateRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/tasks/{$task->id}/subtasks/{$subtask->id}", [
            'title' => 'Updated Subtask Title',
            'priority' => 'Urgent',
        ]);
        $updateRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Subtask Title')
            ->assertJsonPath('data.priority', 'Urgent');

        // Toggle to completed
        $toggleRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/subtasks/{$subtask->id}/toggle");
        $toggleRes->assertStatus(200)
            ->assertJsonPath('data.is_completed', true)
            ->assertJsonPath('data.stage', 'Completed');

        // Toggle back to incomplete
        $toggleBackRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/subtasks/{$subtask->id}/toggle");
        $toggleBackRes->assertStatus(200)
            ->assertJsonPath('data.is_completed', false)
            ->assertJsonPath('data.stage', 'To Do');

        // Delete subtask
        $delRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/tasks/{$task->id}/subtasks/{$subtask->id}");
        $delRes->assertStatus(200)
            ->assertJsonPath('message', 'Subtask deleted successfully.');

        // List must not return it
        $listRes = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/tasks/{$task->id}/subtasks");
        $listRes->assertStatus(200);
        $ids = collect($listRes->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($subtask->id, $ids);
    }

    public function test_can_reorder_subtasks(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $stage = TaskStage::first();

        $task = Task::create([
            'title' => 'Task with reordered subtasks',
            'task_stage_id' => $stage->id,
            'status' => 'Pending',
        ]);

        $sub1 = Subtask::create(['task_id' => $task->id, 'title' => 'Step 1', 'order_column' => 1]);
        $sub2 = Subtask::create(['task_id' => $task->id, 'title' => 'Step 2', 'order_column' => 2]);
        $sub3 = Subtask::create(['task_id' => $task->id, 'title' => 'Step 3', 'order_column' => 3]);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/tasks/{$task->id}/subtasks/reorder", [
            'orders' => [
                ['id' => $sub3->id, 'order' => 1],
                ['id' => $sub1->id, 'order' => 2],
                ['id' => $sub2->id, 'order' => 3],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Subtasks reordered successfully.');

        $this->assertEquals(1, $sub3->fresh()->order_column);
        $this->assertEquals(2, $sub1->fresh()->order_column);
        $this->assertEquals(3, $sub2->fresh()->order_column);
    }
}
