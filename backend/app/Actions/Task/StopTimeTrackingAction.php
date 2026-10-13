<?php

namespace App\Actions\Task;

use App\Models\ActivityLog;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;

class StopTimeTrackingAction
{
    public function execute(Task $task, User $user): ?TaskTimeEntry
    {
        $runningEntry = TaskTimeEntry::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->where('is_running', true)
            ->latest()
            ->first();

        if ($runningEntry) {
            $endedAt = now();
            $duration = $endedAt->diffInSeconds($runningEntry->started_at);

            $runningEntry->update([
                'ended_at' => $endedAt,
                'duration_seconds' => $duration,
                'is_running' => false,
            ]);

            // Update task total actual_minutes
            $totalSeconds = $task->total_tracked_seconds;
            $task->update(['actual_minutes' => (int) round($totalSeconds / 60)]);

            ActivityLog::log(
                action: 'Task Timer Stopped',
                description: "User {$user->name} stopped tracking time on '{$task->title}' (logged {$duration}s)",
                subject: $task,
                causer: $user
            );
        }

        return $runningEntry;
    }
}
