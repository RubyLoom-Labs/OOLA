<?php

namespace App\Actions\Task;

use App\Models\ActivityLog;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;

class StartTimeTrackingAction
{
    public function execute(Task $task, User $user, ?string $notes = null): TaskTimeEntry
    {
        // Stop any currently running timer for this user first
        $activeEntries = TaskTimeEntry::where('user_id', $user->id)
            ->where('is_running', true)
            ->get();

        foreach ($activeEntries as $entry) {
            $endedAt = now();
            $duration = $endedAt->diffInSeconds($entry->started_at);
            $entry->update([
                'ended_at' => $endedAt,
                'duration_seconds' => $duration,
                'is_running' => false,
            ]);
        }

        // Create new running entry with authoritative server timestamp
        $entry = TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'started_at' => now(),
            'notes' => $notes,
            'is_running' => true,
        ]);

        ActivityLog::log(
            action: 'Task Timer Started',
            description: "User {$user->name} started tracking time on task '{$task->title}'",
            subject: $task,
            causer: $user
        );

        return $entry;
    }
}
