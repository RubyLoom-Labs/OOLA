<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inquiry_id' => $this->inquiry_id,
            'lead_code' => $this->lead_code,
            'lead_title' => $this->lead_title,
            'requirement_name' => $this->requirement_name,
            'requirement_details' => $this->requirement_details,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'contact_number' => $this->contact_number,
            'subject' => $this->subject,
            'message' => $this->message,
            'customer_id' => $this->customer_id,
            'customer' => new CompanyResource($this->whenLoaded('customer')),
            'contact_id' => $this->contact_id,
            'contact' => new ContactResource($this->whenLoaded('contact')),
            'lead_stage_id' => $this->lead_stage_id,
            'stage' => $this->whenLoaded('stage'),
            'lead_source_id' => $this->lead_source_id,
            'source' => $this->whenLoaded('source'),
            'budget_quoted' => (float) $this->budget_quoted,
            'currency' => $this->currency,
            'priority' => $this->priority,
            'status' => $this->status,
            'next_step' => $this->next_step,
            'expected_closing_date' => $this->expected_closing_date?->format('Y-m-d'),
            'lost_reason' => $this->lost_reason,
            'lost_note' => $this->lost_note,
            'lost_at' => $this->lost_at?->toISOString(),
            'users' => UserResource::collection($this->whenLoaded('users')),
            'tasks_count' => $this->tasks_count,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
