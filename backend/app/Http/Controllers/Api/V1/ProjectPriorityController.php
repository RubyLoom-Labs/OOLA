<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectPriorityResource;
use App\Models\ProjectPriority;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectPriorityController extends Controller
{
    /**
     * Display a listing of active project priorities (is_delete = 0).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProjectPriority::where('is_delete', false);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where('name', 'like', "%{$search}%");
        }

        $priorities = $query->orderBy('order_column', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => ProjectPriorityResource::collection($priorities),
        ]);
    }

    /**
     * Display a single project priority (is_delete = 0).
     */
    public function show(int $id): JsonResponse
    {
        $priority = ProjectPriority::where('is_delete', false)->findOrFail($id);

        return response()->json([
            'data' => new ProjectPriorityResource($priority),
        ]);
    }

    /**
     * Store a newly created project priority.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $validated['is_delete'] = false;

        $priority = ProjectPriority::create($validated);

        return (new ProjectPriorityResource($priority))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update an existing project priority.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $priority = ProjectPriority::where('is_delete', false)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $priority->update($validated);

        return response()->json([
            'data' => new ProjectPriorityResource($priority),
        ]);
    }

    /**
     * Soft delete a project priority (set is_delete = 1).
     */
    public function destroy(int $id): JsonResponse
    {
        $priority = ProjectPriority::where('is_delete', false)->findOrFail($id);
        $priority->logicalDelete();

        return response()->json([
            'message' => 'Project priority removed successfully.',
        ]);
    }

    /**
     * Get the active priority names list as an array for dropdowns.
     */
    public function priorityNames(): JsonResponse
    {
        $names = ProjectPriority::where('is_delete', false)
            ->orderBy('order_column', 'asc')
            ->orderBy('id', 'asc')
            ->pluck('name');

        return response()->json([
            'data' => $names,
        ]);
    }
}
