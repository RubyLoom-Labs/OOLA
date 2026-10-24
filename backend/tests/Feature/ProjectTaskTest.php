<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\Task;
use App\Models\TaskStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProjectTaskTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_tasks_table_has_project_id_column(): void
    {
        $this->assertTrue(Schema::hasColumn('tasks', 'project_id'));
    }

    public function test_can_list_project_tasks(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();
        $taskStage = TaskStage::first();

        $project1 = Project::create([
            'project_title' => 'Alpha Migration Project',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $project2 = Project::create([
            'project_title' => 'Beta App Project',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        // Task for project 1
        $task1 = Task::create([
            'title' => 'Database Schema Design',
            'project_id' => $project1->id,
            'task_stage_id' => $taskStage->id,
            'status' => 'Pending',
        ]);

        // Task for project 2
        $task2 = Task::create([
            'title' => 'Mobile App Wireframes',
            'project_id' => $project2->id,
            'task_stage_id' => $taskStage->id,
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$project1->id}/tasks");

        $response->assertStatus(200);
        $titles = collect($response->json('data'))->pluck('title')->toArray();
        $this->assertContains('Database Schema Design', $titles);
        $this->assertNotContains('Mobile App Wireframes', $titles);
    }

    public function test_can_create_task_under_project(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();
        $taskStage = TaskStage::first();

        $project = Project::create([
            'project_title' => 'Payment Gateway Integration',
            'customer_id' => $company->id,
            'project_manager_id' => $admin->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);
        $project->users()->attach($admin->id, ['role' => 'Manager']);

        $payload = [
            'title' => 'Configure Stripe Webhook Endpoints',
            'description' => 'Setup listening for invoice.payment_succeeded events.',
            'task_type' => 'Feature',
            'priority' => 'High',
            'task_stage_id' => $taskStage->id,
            'status' => 'In Progress',
            'estimated_minutes' => 120,
            'user_ids' => [$admin->id],
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/projects/{$project->id}/tasks", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Configure Stripe Webhook Endpoints')
            ->assertJsonPath('data.project_id', $project->id)
            ->assertJsonPath('data.priority', 'High');

        $taskId = $response->json('data.id');

        $this->assertDatabaseHas('tasks', [
            'id' => $taskId,
            'project_id' => $project->id,
            'title' => 'Configure Stripe Webhook Endpoints',
        ]);
    }

    public function test_task_access_checks_if_task_exists_in_project_before_performing_operations(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();
        $taskStage = TaskStage::first();

        $projectA = Project::create([
            'project_title' => 'Project A - Cloud AWS',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $projectB = Project::create([
            'project_title' => 'Project B - Mobile iOS',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        // Task created under Project B
        $taskOfProjectB = Task::create([
            'title' => 'Build iOS Swift UI Component',
            'project_id' => $projectB->id,
            'task_stage_id' => $taskStage->id,
            'status' => 'Pending',
        ]);

        // 1. Trying to SHOW task of Project B through Project A must return 404
        $showRes = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$projectA->id}/tasks/{$taskOfProjectB->id}");
        $showRes->assertStatus(404)
            ->assertJsonPath('message', "Task #{$taskOfProjectB->id} does not belong to Project #{$projectA->id}.");

        // 2. Trying to UPDATE task of Project B through Project A must return 404
        $updateRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/projects/{$projectA->id}/tasks/{$taskOfProjectB->id}", [
            'title' => 'Malicious Rename Attempt',
        ]);
        $updateRes->assertStatus(404)
            ->assertJsonPath('message', "Task #{$taskOfProjectB->id} does not belong to Project #{$projectA->id}.");

        // 3. Trying to DELETE task of Project B through Project A must return 404
        $deleteRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/projects/{$projectA->id}/tasks/{$taskOfProjectB->id}");
        $deleteRes->assertStatus(404)
            ->assertJsonPath('message', "Task #{$taskOfProjectB->id} does not belong to Project #{$projectA->id}.");

        // 4. Non-existent task ID must return 404
        $notFoundRes = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$projectA->id}/tasks/99999");
        $notFoundRes->assertStatus(404)
            ->assertJsonPath('message', 'Task not found.');

        // 5. When accessed through its genuine project (Project B), it succeeds
        $validShow = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$projectB->id}/tasks/{$taskOfProjectB->id}");
        $validShow->assertStatus(200)
            ->assertJsonPath('data.title', 'Build iOS Swift UI Component')
            ->assertJsonPath('data.project_id', $projectB->id);
    }

    public function test_can_update_and_destroy_task_within_its_project(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();
        $taskStage = TaskStage::first();
        $nextStage = TaskStage::skip(1)->first() ?? $taskStage;

        $project = Project::create([
            'project_title' => 'ERP Migration',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $task = Task::create([
            'title' => 'Initial Requirement Gathering',
            'project_id' => $project->id,
            'task_stage_id' => $taskStage->id,
            'status' => 'Pending',
        ]);

        // Update task
        $updateRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/projects/{$project->id}/tasks/{$task->id}", [
            'title' => 'Updated Requirement Gathering Specs',
            'priority' => 'Urgent',
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Requirement Gathering Specs')
            ->assertJsonPath('data.priority', 'Urgent');

        // Update stage
        $stageRes = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/projects/{$project->id}/tasks/{$task->id}/stage", [
            'stage_id' => $nextStage->id,
        ]);
        $stageRes->assertStatus(200)
            ->assertJsonPath('message', 'Task stage updated successfully');

        // Delete task
        $deleteRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/projects/{$project->id}/tasks/{$task->id}");
        $deleteRes->assertStatus(200)
            ->assertJsonPath('message', 'Task removed from project successfully.');

        // List must no longer return it
        $listRes = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$project->id}/tasks");
        $listRes->assertStatus(200);
        $ids = collect($listRes->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($task->id, $ids);
    }
}
