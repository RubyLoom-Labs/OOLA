<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function __construct(protected ProjectService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $projects = $this->service->getList($request->all(), (int)$request->get('per_page', 15));
        return ProjectResource::collection($projects);
    }

    public function kanban(): JsonResponse
    {
        $kanban = $this->service->getKanban();
        return response()->json($kanban);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $this->service->createProject(
            $request->validated(),
            $request->input('user_ids', [])
        );
        return (new ProjectResource($project->load(['customer', 'manager', 'stage', 'users'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Project $project): ProjectResource
    {
        return new ProjectResource($project->load([
            'customer',
            'lead',
            'manager',
            'stage',
            'users',
            'tasks.users',
            'tasks.subtasks',
            'tasks.stage',
            'payments',
            'expenses',
        ]));
    }

    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $project = $this->service->updateProject($project, $request->validated());
        return new ProjectResource($project->load(['customer', 'manager', 'stage', 'users']));
    }

    public function updateStage(Request $request, Project $project): JsonResponse
    {
        $request->validate(['stage_id' => ['required', 'exists:project_stages,id']]);
        $project = $this->service->updateStage($project, (int)$request->stage_id);
        return response()->json([
            'message' => 'Project stage updated successfully',
            'project' => new ProjectResource($project->load('stage')),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->logicalDelete();
        return response()->json(['message' => 'Project archived successfully.']);
    }
}
