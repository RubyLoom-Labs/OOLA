<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubtaskResource;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubtaskController extends Controller
{
    /**
     * List all subtasks for a task.
     */
    public function index(Request $request, ...$args): AnonymousResourceCollection|JsonResponse
    {
        $task = $this->resolveTaskFromRoute($args, $request);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        $query = $task->subtasks()->with('assignedUser:id,name,email,avatar');

        if ($request->has('is_completed') && $request->input('is_completed') !== null && $request->input('is_completed') !== '') {
            $isCompleted = filter_var($request->input('is_completed'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_completed', $isCompleted);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('assigned_user_id')) {
            $query->where('assigned_user_id', (int) $request->input('assigned_user_id'));
        }

        $subtasks = $query->orderBy('order_column')->orderBy('id')->get();

        return SubtaskResource::collection($subtasks);
    }

    /**
     * Store a new subtask under a task.
     */
    public function store(Request $request, ...$args): JsonResponse
    {
        $task = $this->resolveTaskFromRoute($args, $request);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'stage' => ['nullable', 'string', 'max:100'],
            'due_date' => ['nullable', 'date'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'is_completed' => ['nullable', 'boolean'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $validated['task_id'] = $task->id;

        if (! isset($validated['order_column'])) {
            $maxOrder = (int) $task->subtasks()->max('order_column');
            $validated['order_column'] = $maxOrder + 1;
        }

        if (isset($validated['is_completed']) && empty($validated['stage'])) {
            $isCompleted = filter_var($validated['is_completed'], FILTER_VALIDATE_BOOLEAN);
            $validated['stage'] = $isCompleted ? 'Completed' : 'To Do';
        }

        $subtask = Subtask::create($validated);

        return (new SubtaskResource($subtask->load('assignedUser')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Show a single subtask, verifying it exists and belongs to the task.
     */
    public function show(Request $request, ...$args): JsonResponse|SubtaskResource
    {
        $resolved = $this->resolveTaskAndSubtask($args, $request);
        if ($resolved instanceof JsonResponse) {
            return $resolved;
        }

        /** @var Subtask $subtask */
        $subtask = $resolved['subtask'];

        return new SubtaskResource($subtask->load('assignedUser'));
    }

    /**
     * Update a subtask, verifying it exists and belongs to the task.
     */
    public function update(Request $request, ...$args): JsonResponse|SubtaskResource
    {
        $resolved = $this->resolveTaskAndSubtask($args, $request);
        if ($resolved instanceof JsonResponse) {
            return $resolved;
        }

        /** @var Subtask $subtask */
        $subtask = $resolved['subtask'];

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'is_completed' => ['nullable', 'boolean'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'stage' => ['nullable', 'string', 'max:100'],
            'due_date' => ['nullable', 'date'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'order_column' => ['nullable', 'integer'],
        ]);

        if (array_key_exists('is_completed', $validated) && ! isset($validated['stage'])) {
            $isCompleted = filter_var($validated['is_completed'], FILTER_VALIDATE_BOOLEAN);
            $validated['stage'] = $isCompleted ? 'Completed' : 'To Do';
        }

        $subtask->update($validated);

        return new SubtaskResource($subtask->load('assignedUser'));
    }

    /**
     * Toggle subtask completion status.
     */
    public function toggle(Request $request, ...$args): JsonResponse|SubtaskResource
    {
        $resolved = $this->resolveTaskAndSubtask($args, $request);
        if ($resolved instanceof JsonResponse) {
            return $resolved;
        }

        /** @var Subtask $subtask */
        $subtask = $resolved['subtask'];

        $subtask->is_completed = ! $subtask->is_completed;
        $subtask->stage = $subtask->is_completed ? 'Completed' : 'To Do';
        $subtask->save();

        return new SubtaskResource($subtask->load('assignedUser'));
    }

    /**
     * Reorder subtasks inside a task.
     */
    public function reorder(Request $request, ...$args): JsonResponse
    {
        $task = $this->resolveTaskFromRoute($args, $request);
        if ($task instanceof JsonResponse) {
            return $task;
        }

        $request->validate([
            'orders' => ['required', 'array'],
            'orders.*.id' => ['required', 'integer', 'exists:subtasks,id'],
            'orders.*.order' => ['required', 'integer'],
        ]);

        foreach ($request->input('orders') as $item) {
            Subtask::where('id', $item['id'])
                ->where('task_id', $task->id)
                ->update(['order_column' => (int) $item['order']]);
        }

        $subtasks = $task->subtasks()->with('assignedUser:id,name,email,avatar')->orderBy('order_column')->get();

        return response()->json([
            'message' => 'Subtasks reordered successfully.',
            'data' => SubtaskResource::collection($subtasks),
        ]);
    }

    /**
     * Delete/archive a subtask.
     */
    public function destroy(Request $request, ...$args): JsonResponse
    {
        $resolved = $this->resolveTaskAndSubtask($args, $request);
        if ($resolved instanceof JsonResponse) {
            return $resolved;
        }

        /** @var Subtask $subtask */
        $subtask = $resolved['subtask'];

        $subtask->logicalDelete();

        return response()->json(['message' => 'Subtask deleted successfully.']);
    }

    /**
     * Resolve task from route parameters or request input.
     */
    protected function resolveTaskFromRoute(array $args, Request $request): Task|JsonResponse
    {
        $task = null;
        $project = null;

        foreach ($args as $arg) {
            if ($arg instanceof Project) {
                $project = $arg;
            } elseif ($arg instanceof Task) {
                $task = $arg;
            } elseif (is_numeric($arg) && ! $task) {
                $task = Task::find($arg);
            }
        }

        if (! $task && $request->filled('task_id')) {
            $task = Task::find($request->input('task_id'));
        }

        if (! $task) {
            return response()->json(['message' => 'Task not found or not specified.'], 404);
        }

        if ($project) {
            $belongsToProject = ((int) $task->project_id === (int) $project->id)
                || ($task->taskable_type === Project::class && (int) $task->taskable_id === (int) $project->id);

            if (! $belongsToProject) {
                return response()->json([
                    'message' => "Task #{$task->id} does not belong to Project #{$project->id}.",
                ], 404);
            }
        }

        return $task;
    }

    /**
     * Resolve task and subtask with strict ownership verification.
     */
    protected function resolveTaskAndSubtask(array $args, Request $request): array|JsonResponse
    {
        $project = null;
        $task = null;
        $subtask = null;

        foreach ($args as $arg) {
            if ($arg instanceof Project) {
                $project = $arg;
            } elseif ($arg instanceof Task) {
                $task = $arg;
            } elseif ($arg instanceof Subtask) {
                $subtask = $arg;
            } elseif (is_numeric($arg)) {
                if (! $task && count($args) >= 2) {
                    $task = Task::find($arg);
                } elseif (! $subtask) {
                    $subtask = Subtask::find($arg);
                }
            }
        }

        if (! $subtask) {
            return response()->json(['message' => 'Subtask not found.'], 404);
        }

        // If task was in the route, verify subtask belongs to task
        if ($task && (int) $subtask->task_id !== (int) $task->id) {
            return response()->json([
                'message' => "Subtask #{$subtask->id} does not belong to Task #{$task->id}.",
            ], 404);
        }

        // If project was in the route, verify task belongs to project
        if ($project && $task) {
            $belongsToProject = ((int) $task->project_id === (int) $project->id)
                || ($task->taskable_type === Project::class && (int) $task->taskable_id === (int) $project->id);

            if (! $belongsToProject) {
                return response()->json([
                    'message' => "Task #{$task->id} does not belong to Project #{$project->id}.",
                ], 404);
            }
        }

        return [
            'project' => $project,
            'task' => $task,
            'subtask' => $subtask,
        ];
    }
}
