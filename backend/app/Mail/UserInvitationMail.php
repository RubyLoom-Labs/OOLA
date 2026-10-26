<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $resetUrl,
        public bool $isNewUser = true
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->isNewUser
            ? 'Welcome to OOLA CRM - Verify Your Email & Set Up Your Password'
            : 'Reset Your Password - OOLA CRM';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user-invitation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
