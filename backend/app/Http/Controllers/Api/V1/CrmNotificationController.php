<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CrmNotificationResource;
use App\Models\CrmNotification;
use App\Services\ReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CrmNotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $userId = $this->resolveUserId($request);
        if ($userId) {
            ReminderService::processDueReminders($userId);
        }

        $notifications = CrmNotification::where('user_id', $userId)
            ->latest()
            ->paginate((int) $request->get('per_page', 20));

        return CrmNotificationResource::collection($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $this->resolveUserId($request);
        if ($userId) {
            ReminderService::processDueReminders($userId);
        }

        $count = CrmNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function markAsRead(Request $request, CrmNotification $crmNotification): JsonResponse
    {
        $userId = $this->resolveUserId($request);
        if ($crmNotification->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $crmNotification->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $this->resolveUserId($request);

        CrmNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * Check and process due reminders immediately.
     */
    public function checkReminders(Request $request): JsonResponse
    {
        $userId = $this->resolveUserId($request);
        $count = ReminderService::processDueReminders($userId);

        return response()->json([
            'message' => "Checked reminders. Processed: {$count}",
            'processed_count' => $count,
        ]);
    }

    /**
     * Server-Sent Events (SSE) real-time streaming endpoint.
     */
    public function stream(Request $request): StreamedResponse
    {
        $user = $request->user();
        if (! $user && $request->has('token')) {
            $token = $request->input('token');
            $pat = PersonalAccessToken::findToken($token);
            if ($pat) {
                $user = $pat->tokenable;
            }
        }

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $userId = $user->id;
        ReminderService::processDueReminders($userId);

        return response()->stream(function () use ($userId) {
            // Disable output buffering
            while (ob_get_level() > 0) {
                ob_end_flush();
            }
            flush();

            // Initial connection event
            $unreadCount = CrmNotification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();
            $recent = CrmNotification::where('user_id', $userId)
                ->latest()
                ->take(15)
                ->get();

            echo "event: init\n";
            echo 'data: '.json_encode([
                'unread_count' => $unreadCount,
                'notifications' => CrmNotificationResource::collection($recent),
            ])."\n\n";
            flush();

            $lastCheck = now()->subSeconds(2);
            $startTime = time();
            $maxTime = 25; // 25s loop per connection

            while (time() - $startTime < $maxTime) {
                if (connection_aborted()) {
                    break;
                }

                // Periodically check due reminders
                ReminderService::processDueReminders($userId);

                $newItems = CrmNotification::where('user_id', $userId)
                    ->where('created_at', '>', $lastCheck)
                    ->get();

                if ($newItems->isNotEmpty()) {
                    $lastCheck = now();
                    $unread = CrmNotification::where('user_id', $userId)
                        ->where('is_read', false)
                        ->count();

                    foreach ($newItems as $item) {
                        echo "event: notification\n";
                        echo 'data: '.json_encode([
                            'unread_count' => $unread,
                            'notification' => new CrmNotificationResource($item),
                        ])."\n\n";
                        flush();
                    }
                } else {
                    echo "event: ping\n";
                    echo 'data: ["time": '.time()."]\n\n";
                    flush();
                }

                sleep(2);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    protected function resolveUserId(Request $request): ?int
    {
        if ($request->user()) {
            return $request->user()->id;
        }

        if ($request->has('token')) {
            $pat = PersonalAccessToken::findToken($request->input('token'));
            if ($pat) {
                return $pat->tokenable_id;
            }
        }

        return null;
    }
}
