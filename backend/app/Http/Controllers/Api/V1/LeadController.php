<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LeadController extends Controller
{
    public function __construct(protected LeadService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $leads = $this->service->getList($request->all(), (int)$request->get('per_page', 15));
        return LeadResource::collection($leads);
    }

    public function kanban(): JsonResponse
    {
        $kanban = $this->service->getKanban();
        return response()->json($kanban);
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = $this->service->createLead(
            $request->validated(),
            $request->input('user_ids', [])
        );
        return (new LeadResource($lead->load(['customer', 'stage', 'users'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Lead $lead): LeadResource
    {
        return new LeadResource($lead->load([
            'customer',
            'contact',
            'stage',
            'source',
            'users',
            'tasks.users',
            'tasks.subtasks',
            'tasks.stage',
        ]));
    }

    public function update(UpdateLeadRequest $request, Lead $lead): LeadResource
    {
        $lead = $this->service->updateLead($lead, $request->validated());
        return new LeadResource($lead->load(['customer', 'stage', 'users']));
    }

    public function updateStage(Request $request, Lead $lead): JsonResponse
    {
        $stageId = $request->input('lead_stage_id') ?? $request->input('stage_id');
        
        $request->validate([
            'lead_stage_id' => ['nullable', 'exists:lead_stages,id'],
            'stage_id' => ['nullable', 'exists:lead_stages,id'],
        ]);

        if (!$stageId) {
            return response()->json(['message' => 'The lead_stage_id field is required.'], 422);
        }

        $lead = $this->service->updateStage($lead, (int)$stageId);
        $resource = new LeadResource($lead->load('stage'));

        return response()->json([
            'message' => 'Lead stage updated successfully',
            'lead' => $resource,
            'data' => $resource,
        ]);
    }

    public function assignUser(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', 'string', 'in:Owner,Manager,Developer,Designer,Follower'],
        ]);

        $this->service->assignUser($lead, (int)$request->user_id, $request->get('role', 'Follower'));

        return response()->json(['message' => 'User assigned to lead successfully.']);
    }

    public function removeUser(Request $request, Lead $lead, int $userId): JsonResponse
    {
        $this->service->removeUser($lead, $userId);
        return response()->json(['message' => 'User removed from lead successfully.']);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->logicalDelete();
        return response()->json(['message' => 'Lead archived successfully.']);
    }
}
