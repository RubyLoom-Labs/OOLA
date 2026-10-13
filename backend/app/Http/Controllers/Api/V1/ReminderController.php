<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reminders = Reminder::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->orderBy('remind_at', 'asc')
            ->get();

        return response()->json($reminders);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'remindable_type' => ['nullable', 'string'],
            'remindable_id' => ['nullable', 'integer'],
            'reminder_type' => ['nullable', 'string'],
            'remind_at' => ['required', 'date'],
        ]);

        $validated['user_id'] = $request->user()->id;

        $reminder = Reminder::create($validated);

        return response()->json($reminder, 201);
    }
}
