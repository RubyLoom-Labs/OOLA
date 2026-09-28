<?php

namespace App\Actions\Lead;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\LeadStage;

class UpdateLeadStageAction
{
    public function execute(Lead $lead, int $stageId, ?string $lostReason = null, ?string $lostNote = null): Lead
    {
        $oldStageName = $lead->stage?->name ?? 'None';
        $newStage = LeadStage::findOrFail($stageId);

        $lead->lead_stage_id = $stageId;

        if ($newStage->is_lost) {
            $lead->status = 'Lost';
            $lead->lost_reason = $lostReason;
            $lead->lost_note = $lostNote;
            $lead->lost_at = now();
        } elseif ($newStage->is_won) {
            $lead->status = 'Won';
        } else {
            $lead->status = 'Active';
        }

        $lead->save();

        ActivityLog::log(
            action: 'Lead Stage Changed',
            description: "Lead '{$lead->lead_title}' stage updated from '{$oldStageName}' to '{$newStage->name}'",
            subject: $lead,
            properties: [
                'from_stage' => $oldStageName,
                'to_stage' => $newStage->name,
                'lost_reason' => $lostReason,
            ]
        );

        return $lead->load(['stage', 'customer', 'users']);
    }
}
