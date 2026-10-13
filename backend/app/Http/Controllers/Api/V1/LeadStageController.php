<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LeadStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadStageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(LeadStage::orderBy('order_column')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', 'unique:lead_stages,slug'],
            'color' => ['nullable', 'string', 'max:50'],
            'order_column' => ['nullable', 'integer'],
            'is_won' => ['nullable', 'boolean'],
            'is_lost' => ['nullable', 'boolean'],
        ]);

        $stage = LeadStage::create($validated);

        return response()->json($stage, 201);
    }
}
