<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectStatusResource;
use App\Models\ProjectStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectStatusController extends Controller
{
    /**
     * Display a listing of active project statuses (is_delete = 0).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProjectStage::where('is_delete', false);

        // Optional filter: is_completed (boolean or 1/0)
        if ($request->has('is_completed') && $request->input('is_completed') !== null && $request->input('is_completed') !== '') {
            $query->where('is_completed', $request->boolean('is_completed'));
        }

        // Optional search by name or slug
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $statuses = $query->orderBy('order_column', 'asc')->get();

        return response()->json([
            'data' => ProjectStatusResource::collection($statuses),
        ]);
    }

    /**
     * Display a single project status (is_delete = 0).
     */
    public function show(int $id): JsonResponse
    {
        $status = ProjectStage::where('is_delete', false)->findOrFail($id);

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
            'slug' => ['nullable', 'string', 'max:100', 'unique:project_stages,slug'],
            'color' => ['nullable', 'string', 'max:50'],
            'order_column' => ['nullable', 'integer'],
            'is_completed' => ['nullable', 'boolean'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $validated['is_delete'] = false;

        $status = ProjectStage::create($validated);

        return (new ProjectStatusResource($status))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update an existing project status.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $status = ProjectStage::where('is_delete', false)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:project_stages,slug,'.$status->id],
            'color' => ['nullable', 'string', 'max:50'],
            'order_column' => ['nullable', 'integer'],
            'is_completed' => ['nullable', 'boolean'],
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
        $status = ProjectStage::where('is_delete', false)->findOrFail($id);
        $status->logicalDelete();

        return response()->json([
            'message' => 'Project status removed successfully.',
        ]);
    }

    /**
     * Get the delivery status enum options ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled').
     */
    public function deliveryStatuses(): JsonResponse
    {
        return response()->json([
            'data' => [
                'Not Started',
                'In Progress',
                'On Hold',
                'Completed',
                'Cancelled',
            ],
        ]);
    }
}
