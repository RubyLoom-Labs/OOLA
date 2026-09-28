<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CrmNotificationResource;
use App\Models\CrmNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CrmNotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $notifications = CrmNotification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate((int)$request->get('per_page', 20));

        return CrmNotificationResource::collection($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = CrmNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function markAsRead(Request $request, CrmNotification $crmNotification): JsonResponse
    {
        if ($crmNotification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $crmNotification->update(['is_read' => true, 'read_at' => now()]);
        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        CrmNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
