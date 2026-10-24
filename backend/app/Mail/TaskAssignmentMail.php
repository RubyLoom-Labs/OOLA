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

class TaskAssignmentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Task $task,
        public ?Project $project = null
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->task->task_code ? "[{$this->task->task_code}] " : '';

        return new Envelope(
            subject: "{$code}New Task Assigned: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.task-assigned',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
