<?php

namespace App\Http\Resources\V1;

use App\Http\Resources\CompanyResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_code' => $this->lead_code,
            'lead_title' => $this->lead_title,
            'requirement_name' => $this->requirement_name,
            'requirement_details' => $this->requirement_details,
            'customer' => new CompanyResource($this->whenLoaded('customer')),
            'contact' => $this->whenLoaded('contact'),
            'stage' => $this->whenLoaded('stage'),
            'source' => $this->whenLoaded('source'),
            'budget_quoted' => (float) $this->budget_quoted,
            'currency' => $this->currency,
            'priority' => $this->priority,
            'status' => $this->status,
            'next_step' => $this->next_step,
            'expected_closing_date' => $this->expected_closing_date?->format('Y-m-d'),
            'lost_reason' => $this->lost_reason,
            'lost_note' => $this->lost_note,
            'lost_at' => $this->lost_at?->toIso8601String(),
            'assigned_users' => UserResource::collection($this->whenLoaded('users')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'tasks_count' => $this->whenCounted('tasks'),
            'total_working_seconds' => $this->total_working_seconds,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
