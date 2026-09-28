<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WhatsappTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsappTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(WhatsappTemplate::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:whatsapp_templates,slug'],
            'category' => ['nullable', 'string', 'max:100'],
            'message_body' => ['required', 'string'],
            'variables' => ['nullable', 'array'],
        ]);

        $template = WhatsappTemplate::create($validated);
        return response()->json($template, 201);
    }
}
