<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function __construct(protected TaskService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $tasks = $this->service->getList($request->all(), (int) $request->get('per_page', 15));

        return TaskResource::collection($tasks);
    }

    public function kanban(Request $request): JsonResponse
    {
        $kanban = $this->service->getKanban(
            $request->get('taskable_type'),
            $request->get('taskable_id') ? (int) $request->get('taskable_id') : null
        );

        return response()->json($kanban);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->service->createTask(
            $request->validated(),
            $request->input('user_ids', [])
        );

        return (new TaskResource($task->load(['taskable', 'stage', 'users', 'subtasks'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        return new TaskResource($task->load(['taskable', 'stage', 'users', 'subtasks.assignedUser', 'timeEntries.user']));
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $task = $this->service->updateTask(
            $task,
            $request->validated(),
            $request->input('user_ids')
        );

        return new TaskResource($task->load(['taskable', 'stage', 'users', 'subtasks']));
    }

    public function updateStage(Request $request, Task $task): JsonResponse
    {
        $request->validate(['stage_id' => ['required', 'exists:task_stages,id']]);
        $task = $this->service->updateStage($task, (int) $request->stage_id);

        return response()->json([
            'message' => 'Task stage updated successfully',
            'task' => new TaskResource($task->load('stage')),
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->logicalDelete();

        return response()->json(['message' => 'Task archived successfully.']);
    }
}
