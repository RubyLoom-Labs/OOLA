<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_code' => $this->customer_code,
            'company_name' => $this->company_name,
            'company_type' => $this->company_type,
            'designation' => $this->designation,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'status' => $this->status,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'notes' => $this->notes,
            'contacts' => $this->whenLoaded('contacts'),
            'leads_count' => $this->whenCounted('leads'),
            'projects_count' => $this->whenCounted('projects'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
