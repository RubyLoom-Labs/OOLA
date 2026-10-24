<?php

namespace App\Mail;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectAssignmentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Project $project,
        public string $assignedRole = 'Team Member'
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->project->project_code ? "[{$this->project->project_code}] " : '';

        return new Envelope(
            subject: "{$code}You have been assigned to project: {$this->project->project_title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.project-assigned',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
