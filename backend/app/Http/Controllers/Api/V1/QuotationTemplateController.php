<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\QuotationTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(QuotationTemplate::with('versions')->where('is_active', true)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:quotation_templates,slug'],
            'description' => ['nullable', 'string'],
            'layout_json' => ['nullable', 'array'],
        ]);

        $template = QuotationTemplate::create($validated);
        return response()->json($template, 201);
    }
}
