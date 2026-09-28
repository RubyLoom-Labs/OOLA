<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactPhoneNumberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'contact_id' => $this->contact_id,
            'phone_number' => $this->phone_number,
            'type' => $this->type,
            'is_primary' => (bool)$this->is_primary,
            'is_whatsapp' => (bool)$this->is_whatsapp,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
