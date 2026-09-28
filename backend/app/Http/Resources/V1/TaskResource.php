<?php

namespace App\Http\Resources\V1;

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
            'stage' => $this->whenLoaded('stage'),
            'status' => $this->status,
            'start_date' => $this->start_date?->toIso8601String(),
            'due_date' => $this->due_date?->toIso8601String(),
            'estimated_minutes' => $this->estimated_minutes,
            'actual_minutes' => $this->actual_minutes,
            'total_tracked_seconds' => $this->total_tracked_seconds,
            'taskable_type' => $this->taskable_type ? class_basename($this->taskable_type) : null,
            'taskable_id' => $this->taskable_id,
            'taskable' => $this->whenLoaded('taskable'),
            'users' => UserResource::collection($this->whenLoaded('users')),
            'subtasks' => $this->whenLoaded('subtasks'),
            'running_time_entry' => $this->whenLoaded('runningTimeEntry'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
