<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectStatusResource;
use App\Models\ProjectStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectStageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProjectStage::where('is_delete', false);

        if ($request->has('is_completed') && $request->input('is_completed') !== null && $request->input('is_completed') !== '') {
            $query->where('is_completed', $request->boolean('is_completed'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $stages = $query->orderBy('order_column')->get();

        return response()->json([
            'data' => ProjectStatusResource::collection($stages),
        ]);
    }
}
