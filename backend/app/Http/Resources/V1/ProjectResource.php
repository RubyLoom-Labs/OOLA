<?php

namespace App\Http\Resources\V1;

use App\Http\Resources\CompanyResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_code' => $this->project_code,
            'project_title' => $this->project_title,
            'description' => $this->description,
            'customer' => new CompanyResource($this->whenLoaded('customer')),
            'lead' => $this->whenLoaded('lead'),
            'manager' => new UserResource($this->whenLoaded('manager')),
            'stage' => $this->whenLoaded('stage'),
            'project_type' => $this->project_type,
            'priority' => $this->priority,
            'status' => $this->status,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'expected_end_date' => $this->expected_end_date?->format('Y-m-d'),
            'actual_end_date' => $this->actual_end_date?->format('Y-m-d'),
            'budget' => (float) $this->budget,
            'quoted_amount' => (float) $this->quoted_amount,
            'cost' => (float) $this->cost,
            'revenue' => (float) $this->revenue,
            'profit' => (float) $this->profit,
            'profit_margin' => $this->profit_margin,
            'outstanding_balance' => $this->outstanding_balance,
            'assigned_users' => UserResource::collection($this->whenLoaded('users')),
            'tasks_count' => $this->whenCounted('tasks'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
