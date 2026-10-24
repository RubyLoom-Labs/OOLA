<?php

namespace App\Services;

use App\Models\CrmNotification;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Send in-app notification and optional email to a user.
     */
    public static function send(
        int|User $user,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null,
        ?Mailable $mailable = null
    ): CrmNotification {
        $userModel = $user instanceof User ? $user : User::find($user);
        $userId = $userModel?->id ?? ($user instanceof User ? $user->id : $user);

        $notification = CrmNotification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'action_url' => $actionUrl,
            'is_read' => false,
        ]);

        // Send email if mailable and user email exist
        if ($mailable && $userModel && ! empty($userModel->email)) {
            try {
                Mail::to($userModel->email)->send($mailable);
                Log::info("Notification email dispatched to {$userModel->email} for '{$title}'");
            } catch (\Throwable $e) {
                Log::warning("Failed to send notification email to {$userModel->email}: ".$e->getMessage());
            }
        }

        return $notification;
    }

    /**
     * Send in-app notification to multiple users.
     */
    public static function sendMany(
        array $userIds,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null,
        ?\Closure $mailableFactory = null
    ): void {
        foreach ($userIds as $id) {
            $user = User::find($id);
            if ($user) {
                $mailable = $mailableFactory ? $mailableFactory($user) : null;
                self::send($user, $title, $message, $type, $actionUrl, $mailable);
            }
        }
    }
}
