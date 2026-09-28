<?php

namespace App\Services;

use App\Models\CrmNotification;
use App\Models\User;

class NotificationService
{
    /**
     * Send notification to a specific user.
     */
    public static function send(
        int|User $user,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null
    ): CrmNotification {
        $userId = $user instanceof User ? $user->id : $user;

        return CrmNotification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'action_url' => $actionUrl,
            'is_read' => false,
        ]);
    }

    /**
     * Send notification to multiple users.
     */
    public static function sendMany(
        array $userIds,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null
    ): void {
        foreach ($userIds as $id) {
            self::send($id, $title, $message, $type, $actionUrl);
        }
    }
}
