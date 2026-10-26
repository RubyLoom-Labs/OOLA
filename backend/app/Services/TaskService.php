<?php

namespace App\Services;

use App\Mail\TaskAssignmentMail;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\Task;
use App\Models\TaskStage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Task::with(['taskable', 'stage', 'users', 'subtasks', 'timeEntries'])
            ->withCount(['subtasks']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('task_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['taskable_type']) && ! empty($filters['taskable_id'])) {
            $type = $filters['taskable_type'];
            if ($type === 'project' || $type === 'Project') {
                $type = Project::class;
            } elseif ($type === 'lead' || $type === 'Lead') {
                $type = Lead::class;
            }
            $query->where('taskable_type', $type)
                ->where('taskable_id', $filters['taskable_id']);
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
            $userId = $filters['assigned_user_id'];
            $query->whereHas('users', function ($uq) use ($userId) {
                $uq->where('users.id', $userId);
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function getKanban(?string $taskableType = null, ?int $taskableId = null): Collection
    {
        if ($taskableType === 'project' || $taskableType === 'Project') {
            $taskableType = Project::class;
        } elseif ($taskableType === 'lead' || $taskableType === 'Lead') {
            $taskableType = Lead::class;
        }

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
        // Normalize taskable_type
        if (! empty($data['taskable_type'])) {
            $type = strtolower((string) $data['taskable_type']);
            if ($type === 'project' || $data['taskable_type'] === Project::class) {
                $data['taskable_type'] = Project::class;
                if (! empty($data['taskable_id'])) {
                    $data['project_id'] = $data['taskable_id'];
                }
            } elseif ($type === 'lead' || $data['taskable_type'] === Lead::class) {
                $data['taskable_type'] = Lead::class;
            }
        }

        // Map stage slug or string to task_stage_id if not explicitly provided
        if (empty($data['task_stage_id']) && ! empty($data['stage'])) {
            $stageMap = [
                'to-do' => 1,
                'todo' => 1,
                'in-progress' => 2,
                'review' => 3,
                'completed' => 4,
            ];
            $stageKey = strtolower($data['stage']);
            if (isset($stageMap[$stageKey])) {
                $data['task_stage_id'] = $stageMap[$stageKey];
            } else {
                $foundStage = TaskStage::where('slug', $stageKey)->orWhere('name', $data['stage'])->first();
                if ($foundStage) {
                    $data['task_stage_id'] = $foundStage->id;
                }
            }
        }
        unset($data['stage']);

        $reminderOption = $data['reminder'] ?? null;
        unset($data['reminder']);

        // Enforce Lead / Project assignment constraint
        if (! empty($data['taskable_type']) && ! empty($data['taskable_id']) && ! empty($userIds)) {
            $this->validateTaskAssignment($data['taskable_type'], (int) $data['taskable_id'], $userIds);
        }

        if (empty($data['task_code'])) {
            $data['task_code'] = 'TSK-'.strtoupper(substr(uniqid(), -5));
        }

        $task = Task::create($data);

        if (! empty($userIds)) {
            $task->users()->sync($userIds);
            $this->notifyAssignedUsers($task, $userIds);
        }

        // Setup reminder if due date and reminder option specified
        if (! empty($task->due_date) && ! empty($reminderOption) && ! empty($userIds)) {
            $this->scheduleTaskReminders($task, $userIds, $reminderOption);
        }

        ActivityLogger::log('Task Created', "Created task: {$task->title}", $task);

        return $task;
    }

    public function updateTask(Task $task, array $data, ?array $userIds = null): Task
    {
        $reminderOption = $data['reminder'] ?? null;
        unset($data['reminder']);

        // Normalize taskable_type
        if (! empty($data['taskable_type'])) {
            $type = strtolower((string) $data['taskable_type']);
            if ($type === 'project' || $data['taskable_type'] === Project::class) {
                $data['taskable_type'] = Project::class;
                if (! empty($data['taskable_id'])) {
                    $data['project_id'] = $data['taskable_id'];
                }
            } elseif ($type === 'lead' || $data['taskable_type'] === Lead::class) {
                $data['taskable_type'] = Lead::class;
            }
        }

        if (! empty($data['stage'])) {
            $stageMap = [
                'to-do' => 1,
                'todo' => 1,
                'in-progress' => 2,
                'review' => 3,
                'completed' => 4,
            ];
            $stageKey = strtolower($data['stage']);
            if (isset($stageMap[$stageKey])) {
                $data['task_stage_id'] = $stageMap[$stageKey];
            } else {
                $foundStage = TaskStage::where('slug', $stageKey)->orWhere('name', $data['stage'])->first();
                if ($foundStage) {
                    $data['task_stage_id'] = $foundStage->id;
                }
            }
            unset($data['stage']);
        }

        if ($userIds !== null) {
            if ($task->taskable_type && $task->taskable_id) {
                $this->validateTaskAssignment($task->taskable_type, $task->taskable_id, $userIds);
            }
            $prevIds = $task->users()->pluck('users.id')->toArray();
            $newlyAddedIds = array_diff($userIds, $prevIds);

            $task->users()->sync($userIds);

            if (! empty($newlyAddedIds)) {
                $this->notifyAssignedUsers($task, $newlyAddedIds);
            }

            if (! empty($reminderOption) && ! empty($userIds)) {
                $this->scheduleTaskReminders($task, $userIds, $reminderOption);
            }
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
     * Dispatch in-app notification and email to assigned users.
     */
    protected function notifyAssignedUsers(Task $task, array $userIds): void
    {
        $project = null;
        if ($task->taskable_type === Project::class || $task->taskable_type === 'App\\Models\\Project' || $task->taskable_type === 'project') {
            $project = Project::find($task->taskable_id);
        }

        $users = User::whereIn('id', $userIds)->get();
        $actionUrl = $project ? "/projects/{$project->id}?tab=tasks" : '/tasks';

        foreach ($users as $user) {
            NotificationService::send(
                user: $user,
                title: 'New Task Assigned',
                message: "You have been assigned to task '{$task->title}'".($project ? " in project '{$project->project_title}'" : ''),
                type: 'task',
                actionUrl: $actionUrl,
                mailable: new TaskAssignmentMail($user, $task, $project)
            );
        }
    }

    /**
     * Schedule automated reminder entries for assigned users.
     */
    protected function scheduleTaskReminders(Task $task, array $userIds, string $reminderOption): void
    {
        if ($reminderOption === 'None' || empty($task->due_date)) {
            return;
        }

        $minutesBefore = match ($reminderOption) {
            '30 Mins Before' => 30,
            '1 Hour Before' => 60,
            '1 Day Before' => 1440,
            default => 60,
        };

        $reminderType = match ($reminderOption) {
            '30 Mins Before' => '30min_before',
            '1 Hour Before' => '1h_before',
            '1 Day Before' => '1day_before',
            default => '1h_before',
        };

        $dueDate = Carbon::parse($task->due_date);
        $remindAt = $dueDate->copy()->subMinutes($minutesBefore);

        foreach ($userIds as $userId) {
            Reminder::updateOrCreate(
                [
                    'remindable_type' => Task::class,
                    'remindable_id' => $task->id,
                    'user_id' => $userId,
                ],
                [
                    'reminder_type' => $reminderType,
                    'remind_at' => $remindAt,
                    'status' => 'pending',
                    'notification_sent' => false,
                    'email_sent' => false,
                ]
            );
        }
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
                if (! empty($diff)) {
                    throw ValidationException::withMessages([
                        'users' => ['A task belonging to a Lead may only be assigned to members already added to that Lead.'],
                    ]);
                }
            }
        } elseif (str_ends_with($taskableType, 'Project') || $taskableType === 'project') {
            $project = Project::find($taskableId);
            if ($project) {
                $allowedIds = $project->users()->pluck('users.id')->toArray();
                if ($project->project_manager_id) {
                    $allowedIds[] = $project->project_manager_id;
                }
                $allowedIds = array_unique($allowedIds);
                $diff = array_diff($userIds, $allowedIds);
                if (! empty($diff)) {
                    throw ValidationException::withMessages([
                        'users' => ['A task belonging to a Project may only be assigned to members of that Project.'],
                    ]);
                }
            }
        }
    }
}
