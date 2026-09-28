<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\NotificationResource;
use App\Models\CrmNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        $notifications = CrmNotification::where('user_id', $userId)
            ->latest()
            ->limit(20)
            ->get();

        $unreadCount = CrmNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
            'notifications' => NotificationResource::collection($notifications),
        ]);
    }

    public function markAsRead(CrmNotification $notification): JsonResponse
    {
        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'data' => new NotificationResource($notification),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        CrmNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }
}
