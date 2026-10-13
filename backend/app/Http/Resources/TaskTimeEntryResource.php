<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskTimeEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'task' => new TaskResource($this->whenLoaded('task')),
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'started_at' => $this->started_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'duration_seconds' => (int) $this->duration_seconds,
            'notes' => $this->notes,
            'is_running' => (bool) $this->is_running,
        ];
    }
}
