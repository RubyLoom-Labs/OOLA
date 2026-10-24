<?php

namespace App\Mail;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskDueReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Task $task,
        public string $reminderLabel = 'Soon',
        public ?Project $project = null
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->task->task_code ? "[{$this->task->task_code}] " : '';

        return new Envelope(
            subject: "⏰ {$code}Task Due Reminder: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.task-due-reminder',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
