<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'start_time' => $this->start_time?->toISOString(),
            'end_time' => $this->end_time?->toISOString(),
            'event_type' => $this->event_type,
            'is_all_day' => (bool)$this->is_all_day,
            'location' => $this->location,
            'reminder_before_minutes' => $this->reminder_before_minutes,
            'user_id' => $this->user_id,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'lead_id' => $this->lead_id,
            'project_id' => $this->project_id,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
