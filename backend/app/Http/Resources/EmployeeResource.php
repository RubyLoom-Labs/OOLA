<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department'),
            'designation_id' => $this->designation_id,
            'designation' => $this->whenLoaded('designation'),
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'joining_date' => $this->joining_date?->format('Y-m-d'),
            'salary' => (float) $this->salary,
            'skills' => $this->skills,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
