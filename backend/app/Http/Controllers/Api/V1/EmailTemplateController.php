<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(EmailTemplate::where('is_active', true)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:email_templates,slug'],
            'subject' => ['required', 'string', 'max:255'],
            'body_html' => ['required', 'string'],
            'variables' => ['nullable', 'array'],
        ]);

        $template = EmailTemplate::create($validated);

        return response()->json($template, 201);
    }
}
