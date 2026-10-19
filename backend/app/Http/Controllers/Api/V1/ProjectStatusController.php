<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectStatusResource;
use App\Models\ProjectStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectStatusController extends Controller
{
    /**
     * Display a listing of active project statuses (is_delete = 0).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProjectStatus::where('is_delete', false);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where('name', 'like', "%{$search}%");
        }

        $statuses = $query->orderBy('order_column', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => ProjectStatusResource::collection($statuses),
        ]);
    }

    /**
     * Display a single project status (is_delete = 0).
     */
    public function show(int $id): JsonResponse
    {
        $status = ProjectStatus::where('is_delete', false)->findOrFail($id);

        return response()->json([
            'data' => new ProjectStatusResource($status),
        ]);
    }

    /**
     * Store a newly created project status.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $validated['is_delete'] = false;

        $status = ProjectStatus::create($validated);

        return (new ProjectStatusResource($status))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update an existing project status.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $status = ProjectStatus::where('is_delete', false)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $status->update($validated);

        return response()->json([
            'data' => new ProjectStatusResource($status),
        ]);
    }

    /**
     * Soft delete a project status (set is_delete = 1).
     */
    public function destroy(int $id): JsonResponse
    {
        $status = ProjectStatus::where('is_delete', false)->findOrFail($id);
        $status->logicalDelete();

        return response()->json([
            'message' => 'Project status removed successfully.',
        ]);
    }

    /**
     * Get the active status names list as an array for dropdowns.
     */
    public function deliveryStatuses(): JsonResponse
    {
        $names = ProjectStatus::where('is_delete', false)
            ->orderBy('order_column', 'asc')
            ->orderBy('id', 'asc')
            ->pluck('name');

        return response()->json([
            'data' => $names,
        ]);
    }
}
