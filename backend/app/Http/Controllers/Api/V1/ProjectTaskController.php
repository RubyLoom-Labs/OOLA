<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectTaskController extends Controller
{
    public function __construct(protected TaskService $taskService) {}

    /**
     * List all tasks belonging to the project.
     */
    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $filters = $request->all();
        $filters['taskable_type'] = Project::class;
        $filters['taskable_id'] = $project->id;

        $query = Task::where(function ($q) use ($project) {
            $q->where('project_id', $project->id)
                ->orWhere(function ($sub) use ($project) {
                    $sub->where('taskable_type', Project::class)
                        ->where('taskable_id', $project->id);
                });
        })
            ->with(['stage', 'users', 'subtasks', 'timeEntries'])
            ->withCount(['subtasks']);

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('task_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['stage_id'])) {
            $query->where('task_stage_id', $filters['stage_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['assigned_user_id'])) {
            $userId = (int) $filters['assigned_user_id'];
            $query->whereHas('users', function ($uq) use ($userId) {
                $uq->where('users.id', $userId);
            });
        }

        $perPage = (int) $request->input('per_page', $request->has('page') ? 15 : 0);
        $tasks = $perPage > 0 ? $query->latest()->paginate($perPage) : $query->latest()->get();

        return TaskResource::collection($tasks);
    }

    /**
     * Kanban view for tasks inside this project.
     */
    public function kanban(Project $project): JsonResponse
    {
        $kanban = $this->taskService->getKanban(Project::class, $project->id);

        return response()->json($kanban);
    }

    /**
     * Create a new task under this project.
     */
    public function store(StoreTaskRequest $request, Project $project): JsonResponse
    {
        $data = $request->validated();
        $data['project_id'] = $project->id;
        $data['taskable_type'] = Project::class;
        $data['taskable_id'] = $project->id;

        $task = $this->taskService->createTask(
            $data,
            $request->input('user_ids', [])
        );

        return (new TaskResource($task->load(['project', 'stage', 'users', 'subtasks'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Show a single task after verifying it exists and belongs to the project.
     */
    public function show(Project $project, int|string $taskId): TaskResource|JsonResponse
    {
        $task = $this->findTaskInProject($project, $taskId);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        return new TaskResource($task->load([
            'project',
            'stage',
            'users',
            'subtasks.assignedUser',
            'timeEntries.user',
        ]));
    }

    /**
     * Update a task after verifying it exists and belongs to the project.
     */
    public function update(UpdateTaskRequest $request, Project $project, int|string $taskId): TaskResource|JsonResponse
    {
        $task = $this->findTaskInProject($project, $taskId);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        $data = $request->validated();
        $data['project_id'] = $project->id;

        $updatedTask = $this->taskService->updateTask(
            $task,
            $data,
            $request->input('user_ids')
        );

        return new TaskResource($updatedTask->load(['project', 'stage', 'users', 'subtasks']));
    }

    /**
     * Update a project task's Kanban stage after verifying it belongs to this project.
     */
    public function updateStage(Request $request, Project $project, int|string $taskId): JsonResponse
    {
        $task = $this->findTaskInProject($project, $taskId);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        $request->validate(['stage_id' => ['required', 'exists:task_stages,id']]);
        $updatedTask = $this->taskService->updateStage($task, (int) $request->stage_id);

        return response()->json([
            'message' => 'Task stage updated successfully',
            'task' => new TaskResource($updatedTask->load('stage')),
        ]);
    }

    /**
     * Archive/delete a task after verifying it exists and belongs to the project.
     */
    public function destroy(Project $project, int|string $taskId): JsonResponse
    {
        $task = $this->findTaskInProject($project, $taskId);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        $task->logicalDelete();

        return response()->json([
            'message' => 'Task removed from project successfully.',
        ]);
    }

    /**
     * Verify that the task exists and belongs to this project before proceeding.
     */
    protected function findTaskInProject(Project $project, int|string $taskId): Task|JsonResponse
    {
        $task = Task::find($taskId);

        if (! $task) {
            return response()->json([
                'message' => 'Task not found.',
            ], 404);
        }

        // Verify task belongs to this project
        $belongsToProject = ((int) $task->project_id === (int) $project->id)
            || ($task->taskable_type === Project::class && (int) $task->taskable_id === (int) $project->id);

        if (! $belongsToProject) {
            return response()->json([
                'message' => "Task #{$taskId} does not belong to Project #{$project->id}.",
            ], 404);
        }

        return $task;
    }
}
