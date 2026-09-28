<?php

namespace App\Actions\Lead;

use App\Models\ActivityLog;
use App\Models\Lead;
use Illuminate\Support\Str;

class CreateLeadAction
{
    public function execute(array $data): Lead
    {
        $leadCode = 'LEAD-' . date('Y') . '-' . strtoupper(Str::random(5));
        $data['lead_code'] = $data['lead_code'] ?? $leadCode;
        
        $userIds = $data['user_ids'] ?? [];
        unset($data['user_ids']);

        $lead = Lead::create($data);

        if (!empty($userIds)) {
            $syncData = [];
            foreach ($userIds as $userId) {
                $syncData[$userId] = ['role' => 'Member', 'assigned_at' => now()];
            }
            $lead->users()->sync($syncData);
        }

        ActivityLog::log(
            action: 'Lead Created',
            description: "Lead '{$lead->lead_title}' was created with budget quoted {$lead->currency} " . number_format($lead->budget_quoted, 2),
            subject: $lead
        );

        return $lead->load(['customer', 'stage', 'source', 'users']);
    }
}
