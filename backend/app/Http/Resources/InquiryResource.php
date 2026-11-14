<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fullName = trim("{$this->first_name} {$this->last_name}");

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'firstname' => $this->first_name,
            'lastname' => $this->last_name,
            'full_name' => $fullName,
            'email' => $this->email,
            'contact_number' => $this->contact_number,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => (bool) ($this->status ?? true),
            'created_at' => $this->created_at?->toISOString() ?? $this->created_at,
            'updated_at' => $this->updated_at?->toISOString() ?? $this->updated_at,
        ];
    }
}

