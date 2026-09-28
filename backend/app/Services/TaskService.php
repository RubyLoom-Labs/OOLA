<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskStage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Task::with(['taskable', 'stage', 'users', 'subtasks', 'timeEntries'])
            ->withCount(['subtasks']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('task_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['taskable_type']) && !empty($filters['taskable_id'])) {
            $query->where('taskable_type', $filters['taskable_type'])
                  ->where('taskable_id', $filters['taskable_id']);
        }

        if (!empty($filters['stage_id'])) {
            $query->where('task_stage_id', $filters['stage_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (!empty($filters['assigned_user_id'])) {
            $userId = $filters['assigned_user_id'];
            $query->whereHas('users', function ($uq) use ($userId) {
                $uq->where('users.id', $userId);
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function getKanban(?string $taskableType = null, ?int $taskableId = null): Collection
    {
        return TaskStage::with(['tasks' => function ($query) use ($taskableType, $taskableId) {
            if ($taskableType && $taskableId) {
                $query->where('taskable_type', $taskableType)
                      ->where('taskable_id', $taskableId);
            }
            $query->with(['taskable', 'users', 'subtasks'])
                  ->withCount('subtasks')
                  ->latest();
        }])->orderBy('order_column')->get();
    }

    public function createTask(array $data, ?array $userIds = []): Task
    {
        // Enforce Lead / Project assignment constraint (PRD Section 25)
        if (!empty($data['taskable_type']) && !empty($data['taskable_id']) && !empty($userIds)) {
            $this->validateTaskAssignment($data['taskable_type'], (int)$data['taskable_id'], $userIds);
        }

        if (empty($data['task_code'])) {
            $data['task_code'] = 'TSK-' . strtoupper(substr(uniqid(), -5));
        }

        $task = Task::create($data);

        if (!empty($userIds)) {
            $task->users()->sync($userIds);
        }

        ActivityLogger::log('Task Created', "Created task: {$task->title}", $task);

        if (!empty($userIds)) {
            NotificationService::sendMany(
                $userIds,
                'New Task Assigned',
                "Task assigned: {$task->title}",
                'task',
                "/tasks/{$task->id}"
            );
        }

        return $task;
    }

    public function updateTask(Task $task, array $data, ?array $userIds = null): Task
    {
        if ($userIds !== null && $task->taskable_type && $task->taskable_id) {
            $this->validateTaskAssignment($task->taskable_type, $task->taskable_id, $userIds);
            $task->users()->sync($userIds);
        }

        $task->update($data);

        ActivityLogger::log('Task Updated', "Updated task: {$task->title}", $task);

        return $task;
    }

    public function updateStage(Task $task, int $stageId): Task
    {
        $oldStage = $task->stage?->name;
        $task->task_stage_id = $stageId;

        $newStage = TaskStage::find($stageId);
        if ($newStage?->is_completed) {
            $task->status = 'Completed';
        }

        $task->save();

        ActivityLogger::log('Task Stage Changed', "Task '{$task->title}' moved to {$newStage?->name}", $task);

        return $task;
    }

    /**
     * Validate that assigned users belong to the parent Lead or Project.
     */
    protected function validateTaskAssignment(string $taskableType, int $taskableId, array $userIds): void
    {
        if (str_ends_with($taskableType, 'Lead') || $taskableType === 'lead') {
            $lead = Lead::find($taskableId);
            if ($lead) {
                $allowedIds = $lead->users()->pluck('users.id')->toArray();
                $diff = array_diff($userIds, $allowedIds);
                if (!empty($diff)) {
                    throw ValidationException::withMessages([
                        'users' => ['A task belonging to a Lead may only be assigned to members already added to that Lead.'],
                    ]);
                }
            }
        } elseif (str_ends_with($taskableType, 'Project') || $taskableType === 'project') {
            $project = Project::find($taskableId);
            if ($project) {
                $allowedIds = $project->users()->pluck('users.id')->toArray();
                $diff = array_diff($userIds, $allowedIds);
                if (!empty($diff)) {
                    throw ValidationException::withMessages([
                        'users' => ['A task belonging to a Project may only be assigned to members of that Project.'],
                    ]);
                }
            }
        }
    }
}
