<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskTimeEntryResource;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Services\TaskTimerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskTimeEntryController extends Controller
{
    public function __construct(protected TaskTimerService $service) {}

    public function active(Request $request): JsonResponse
    {
        $active = $this->service->getActiveTimer($request->user());

        return response()->json([
            'active_timer' => $active ? new TaskTimeEntryResource($active) : null,
            'data' => $active ? new TaskTimeEntryResource($active) : null,
        ]);
    }

    public function start(Request $request, Task $task): JsonResponse
    {
        $entry = $this->service->start($task, $request->user(), $request->input('notes'));
        $resource = new TaskTimeEntryResource($entry->load(['task', 'user']));

        return response()->json([
            'message' => 'Timer started',
            'time_entry' => $resource,
            'data' => [
                'id' => $entry->id,
                'task_id' => $task->id,
                'is_running' => (bool) $entry->is_running,
                'started_at' => $entry->started_at?->toISOString(),
            ],
        ]);
    }

    public function pause(Request $request, Task $task): JsonResponse
    {
        $entry = $this->service->pause($task, $request->user());
        $resource = new TaskTimeEntryResource($entry->load(['task', 'user']));

        return response()->json([
            'message' => 'Timer paused',
            'time_entry' => $resource,
            'data' => $resource,
        ]);
    }

    public function resume(Request $request, Task $task): JsonResponse
    {
        $entry = $this->service->resume($task, $request->user());
        $resource = new TaskTimeEntryResource($entry->load(['task', 'user']));

        return response()->json([
            'message' => 'Timer resumed',
            'time_entry' => $resource,
            'data' => $resource,
        ]);
    }

    public function stop(Request $request, Task $task): JsonResponse
    {
        $entry = $this->service->stop($task, $request->user(), $request->input('notes'));
        $resource = new TaskTimeEntryResource($entry->load(['task', 'user']));
        $totalSeconds = TaskTimeEntry::where('task_id', $task->id)->sum('duration_seconds');

        return response()->json([
            'message' => 'Timer stopped',
            'time_entry' => $resource,
            'data' => [
                'task_id' => $task->id,
                'logged_duration_seconds' => (int) $entry->duration_seconds,
                'total_tracked_seconds' => (int) $totalSeconds,
            ],
        ]);
    }
}
