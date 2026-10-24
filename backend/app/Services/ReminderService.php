<?php

namespace App\Services;

use App\Mail\TaskDueReminderMail;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ReminderService
{
    /**
     * Check and process pending reminders due at or before now.
     */
    public static function processDueReminders(?int $userId = null): int
    {
        $query = Reminder::where('status', 'pending')
            ->where('notification_sent', false)
            ->where('remind_at', '<=', Carbon::now())
            ->where('is_delete', false)
            ->with(['user', 'remindable']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $dueReminders = $query->get();
        $processedCount = 0;

        foreach ($dueReminders as $reminder) {
            try {
                $user = $reminder->user;
                if (!$user) {
                    $reminder->update(['status' => 'cancelled']);
                    continue;
                }

                $remindable = $reminder->remindable;
                if ($remindable instanceof Task) {
                    $project = null;
                    if ($remindable->taskable_type === Project::class || $remindable->taskable_type === 'App\\Models\\Project' || $remindable->taskable_type === 'project') {
                        $project = Project::find($remindable->taskable_id);
                    }

                    $reminderLabel = match($reminder->reminder_type) {
                        '30min_before' => 'in 30 minutes',
                        '1h_before' => 'in 1 hour',
                        '1day_before' => 'tomorrow',
                        default => 'soon',
                    };

                    $dueText = $remindable->due_date ? Carbon::parse($remindable->due_date)->format('M d, Y') : 'soon';
                    $actionUrl = $project ? "/projects/{$project->id}?tab=tasks" : "/tasks";

                    NotificationService::send(
                        user: $user,
                        title: '⏰ Task Due Reminder',
                        message: "Task '{$remindable->title}' is due {$reminderLabel} ({$dueText})",
                        type: 'warning',
                        actionUrl: $actionUrl,
                        mailable: new TaskDueReminderMail($user, $remindable, $reminderLabel, $project)
                    );
                }

                $reminder->update([
                    'status' => 'sent',
                    'notification_sent' => true,
                    'email_sent' => true,
                ]);

                $processedCount++;
            } catch (\Throwable $e) {
                Log::error("Failed to process reminder #{$reminder->id}: " . $e->getMessage());
            }
        }

        return $processedCount;
    }
}
