<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CommunicationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunicationLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CommunicationLog::query();
        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }
        return response()->json($query->latest()->paginate((int)$request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['required', 'string', 'in:email,whatsapp,sms'],
            'template_id' => ['nullable', 'integer'],
            'recipient' => ['required', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);

        $validated['status'] = 'sent';
        $validated['sent_at'] = now();
        $validated['external_message_id'] = 'EXT-' . strtoupper(uniqid());

        $log = CommunicationLog::create($validated);
        return response()->json($log, 201);
    }
}
