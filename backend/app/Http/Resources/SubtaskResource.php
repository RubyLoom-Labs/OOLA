<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubtaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'title' => $this->title,
            'is_completed' => $this->is_completed,
            'priority' => $this->priority,
            'stage' => $this->stage,
            'due_date' => $this->due_date?->toISOString(),
            'assigned_user_id' => $this->assigned_user_id,
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'order_column' => $this->order_column,
        ];
    }
}
