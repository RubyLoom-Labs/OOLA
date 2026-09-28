<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_code' => $this->task_code,
            'title' => $this->title,
            'description' => $this->description,
            'task_type' => $this->task_type,
            'priority' => $this->priority,
            'task_stage_id' => $this->task_stage_id,
            'stage' => $this->whenLoaded('stage'),
            'status' => $this->status,
            'taskable_type' => $this->taskable_type,
            'taskable_id' => $this->taskable_id,
            'taskable' => $this->whenLoaded('taskable'),
            'start_date' => $this->start_date?->toISOString(),
            'due_date' => $this->due_date?->toISOString(),
            'estimated_minutes' => $this->estimated_minutes,
            'actual_minutes' => $this->actual_minutes,
            'users' => UserResource::collection($this->whenLoaded('users')),
            'subtasks' => SubtaskResource::collection($this->whenLoaded('subtasks')),
            'subtasks_count' => $this->subtasks_count,
            'time_entries' => TaskTimeEntryResource::collection($this->whenLoaded('timeEntries')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
