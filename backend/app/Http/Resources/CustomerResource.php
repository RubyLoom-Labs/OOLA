<?php

namespace App\Http\Resources;

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
            'residence' => $this->residence,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'status' => $this->status,
            'notes' => $this->notes,
            'contacts' => ContactResource::collection($this->whenLoaded('contacts')),
            'phone_numbers' => ContactPhoneNumberResource::collection($this->whenLoaded('phoneNumbers')),
            'primary_phone_number' => new ContactPhoneNumberResource($this->whenLoaded('primaryPhoneNumber')),
            'leads_count' => $this->leads_count,
            'projects_count' => $this->projects_count,
            'quotations_count' => $this->quotations_count,
            'payments_count' => $this->payments_count,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
