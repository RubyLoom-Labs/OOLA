<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class TaskTimerService
{
    /**
     * Start a new timer for a task.
     */
    public function start(Task $task, User $user, ?string $notes = null): TaskTimeEntry
    {
        // Stop any running timer for this user first
        $this->stopActiveTimerForUser($user);

        $entry = TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'started_at' => now(),
            'notes' => $notes,
            'is_running' => true,
        ]);

        $task->status = 'In Progress';
        $task->saveQuietly();

        ActivityLogger::log('Timer Started', "Started timer on task: {$task->title}", $task);

        return $entry;
    }

    /**
     * Pause the running timer.
     */
    public function pause(Task $task, User $user): TaskTimeEntry
    {
        $running = TaskTimeEntry::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->where('is_running', true)
            ->first();

        if (! $running) {
            throw ValidationException::withMessages(['timer' => ['No active timer found for this task.']]);
        }

        $now = now();
        $duration = $now->diffInSeconds($running->started_at);

        $running->update([
            'ended_at' => $now,
            'duration_seconds' => $duration,
            'is_running' => false,
        ]);

        $this->updateTaskTotalActualMinutes($task);

        ActivityLogger::log('Timer Paused', "Paused timer on task: {$task->title}", $task);

        return $running;
    }

    /**
     * Resume timer (creates a new time entry block).
     */
    public function resume(Task $task, User $user): TaskTimeEntry
    {
        return $this->start($task, $user, 'Resumed work');
    }

    /**
     * Stop timer and close session.
     */
    public function stop(Task $task, User $user, ?string $notes = null): TaskTimeEntry
    {
        $running = TaskTimeEntry::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->where('is_running', true)
            ->first();

        if ($running) {
            $now = now();
            $duration = $now->diffInSeconds($running->started_at);
            $running->update([
                'ended_at' => $now,
                'duration_seconds' => $duration,
                'notes' => $notes ?? $running->notes,
                'is_running' => false,
            ]);
        }

        $this->updateTaskTotalActualMinutes($task);

        ActivityLogger::log('Timer Stopped', "Stopped timer on task: {$task->title}", $task);

        return $running ?? TaskTimeEntry::where('task_id', $task->id)->latest()->first();
    }

    /**
     * Get active timer for user.
     */
    public function getActiveTimer(User $user): ?TaskTimeEntry
    {
        return TaskTimeEntry::with(['task.taskable'])
            ->where('user_id', $user->id)
            ->where('is_running', true)
            ->first();
    }

    protected function stopActiveTimerForUser(User $user): void
    {
        $active = TaskTimeEntry::where('user_id', $user->id)
            ->where('is_running', true)
            ->get();

        foreach ($active as $entry) {
            $now = now();
            $entry->update([
                'ended_at' => $now,
                'duration_seconds' => $now->diffInSeconds($entry->started_at),
                'is_running' => false,
            ]);
            $this->updateTaskTotalActualMinutes($entry->task);
        }
    }

    protected function updateTaskTotalActualMinutes(Task $task): void
    {
        $totalSeconds = TaskTimeEntry::where('task_id', $task->id)->sum('duration_seconds');
        $task->actual_minutes = (int) round($totalSeconds / 60);
        $task->saveQuietly();
    }
}
