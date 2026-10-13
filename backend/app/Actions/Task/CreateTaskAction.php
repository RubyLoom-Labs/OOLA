<?php

namespace App\Actions\Task;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Support\Str;

class CreateTaskAction
{
    public function execute(array $data): Task
    {
        $taskCode = 'TSK-'.strtoupper(Str::random(6));
        $data['task_code'] = $data['task_code'] ?? $taskCode;

        // Resolve taskable type if provided as shorthand
        $taskableType = $data['taskable_type'];
        if (strcasecmp($taskableType, 'lead') === 0) {
            $data['taskable_type'] = Lead::class;
        } elseif (strcasecmp($taskableType, 'project') === 0) {
            $data['taskable_type'] = Project::class;
        }

        $userIds = $data['user_ids'] ?? [];
        $subtasksData = $data['subtasks'] ?? [];
        unset($data['user_ids'], $data['subtasks']);

        $task = Task::create($data);

        if (! empty($userIds)) {
            $task->users()->sync($userIds);
        }

        if (! empty($subtasksData)) {
            $order = 1;
            foreach ($subtasksData as $st) {
                Subtask::create([
                    'task_id' => $task->id,
                    'title' => $st['title'],
                    'is_completed' => $st['is_completed'] ?? false,
                    'order_column' => $order++,
                ]);
            }
        }

        ActivityLog::log(
            action: 'Task Created',
            description: "Task '{$task->title}' created with priority {$task->priority}",
            subject: $task
        );

        return $task->load(['stage', 'users', 'subtasks', 'taskable']);
    }
}
