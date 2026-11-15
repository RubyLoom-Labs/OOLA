<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadStage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class LeadService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::with(['customer', 'contact', 'stage', 'source', 'users'])
            ->withCount(['tasks']);

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('lead_title', 'like', "%{$search}%")
                    ->orWhere('lead_code', 'like', "%{$search}%")
                    ->orWhere('requirement_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['stage_id'])) {
            $query->where('lead_stage_id', $filters['stage_id']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getKanban(): Collection
    {
        return LeadStage::with(['leads' => function ($query) {
            $query->with(['customer', 'contact', 'stage', 'source', 'users', 'tasks'])
                ->withCount('tasks')
                ->latest();
        }])->orderBy('order_column')->get();
    }

    public function createLead(array $data, ?array $userIds = []): Lead
    {
        if (empty($data['lead_code'])) {
            $data['lead_code'] = 'LEAD-'.date('Y').'-'.strtoupper(substr(uniqid(), -4));
        }

        $lead = Lead::create($data);

        if (! empty($userIds)) {
            $lead->users()->sync($userIds);
        }

        ActivityLogger::log('Lead Created', "Created lead: {$lead->lead_title}", $lead);

        // Notify assigned users
        if (! empty($userIds)) {
            NotificationService::sendMany(
                $userIds,
                'New Lead Assigned',
                "You have been assigned to lead '{$lead->lead_title}'",
                'lead',
                "/leads/{$lead->id}"
            );
        }

        return $lead;
    }

    public function updateLead(Lead $lead, array $data): Lead
    {
        $oldStageId = $lead->lead_stage_id;
        $lead->update($data);

        if (isset($data['lead_stage_id']) && $data['lead_stage_id'] != $oldStageId) {
            $newStage = LeadStage::find($data['lead_stage_id']);
            ActivityLogger::log(
                'Lead Stage Changed',
                "Stage updated to {$newStage?->name}",
                $lead,
                ['old_stage_id' => $oldStageId, 'new_stage_id' => $data['lead_stage_id']]
            );
        } else {
            ActivityLogger::log('Lead Updated', "Updated lead: {$lead->lead_title}", $lead);
        }

        return $lead;
    }

    public function updateStage(Lead $lead, int $stageId): Lead
    {
        $oldStage = $lead->stage?->name;
        $lead->lead_stage_id = $stageId;

        $newStage = LeadStage::find($stageId);
        if ($newStage?->is_won) {
            $lead->status = 'Won';
            $lead->lost_at = null;
        } elseif ($newStage?->is_lost) {
            $lead->status = 'Lost';
            $lead->lost_at = now();
        } elseif (in_array($lead->status, ['Won', 'Lost'], true)) {
            $lead->status = 'Active';
            $lead->lost_at = null;
        }

        $lead->save();

        try {
            ActivityLogger::log(
                'Lead Stage Changed',
                "Stage changed from {$oldStage} to {$newStage?->name}",
                $lead
            );
        } catch (\Throwable) {
            // Ignore activity log errors
        }

        return $lead;
    }

    public function assignUser(Lead $lead, int $userId, string $role = 'Follower'): void
    {
        $lead->users()->syncWithoutDetaching([$userId => ['role' => $role]]);

        NotificationService::send(
            $userId,
            'Assigned to Lead',
            "You were added to lead: {$lead->lead_title}",
            'lead',
            "/leads/{$lead->id}"
        );
    }

    public function removeUser(Lead $lead, int $userId): void
    {
        $lead->users()->detach($userId);
    }
}
