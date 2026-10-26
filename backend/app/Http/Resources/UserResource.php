<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'is_verified' => ! is_null($this->email_verified_at),
            'role_id' => $this->role_id,
            'role' => new RoleResource($this->whenLoaded('role')),
            'is_employee' => (bool) $this->is_employee,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
