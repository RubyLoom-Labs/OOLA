<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'company_name' => $this->company_name,
            'company_type' => $this->company_type,
            'owner_name' => $this->owner_name ?? trim("{$this->first_name} {$this->last_name}"),
            'owners' => $this->owners ?? [],
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'designation' => $this->designation,
            'email' => $this->email ?? $this->owner_email,
            'owner_email' => $this->owner_email ?? $this->email,
            'phone' => $this->phone ?? $this->owner_phone,
            'owner_phone' => $this->owner_phone ?? $this->phone,
            'owner_residence' => $this->owner_residence,
            'owner_birthday' => $this->owner_birthday?->format('Y-m-d'),
            'company_address' => $this->company_address,
            'website' => $this->website,
            'state' => $this->state,
            'contact_details' => $this->contact_details,
            'is_primary' => (bool) $this->is_primary,
            'notes' => $this->notes,
            'phone_numbers' => ContactPhoneNumberResource::collection($this->whenLoaded('phoneNumbers')),
            'primary_phone_number' => new ContactPhoneNumberResource($this->whenLoaded('primaryPhoneNumber')),
            'projects_count' => $this->projects_count,
            'projects_history' => $this->when($request->boolean('with_history') || $this->relationLoaded('projects'), function () {
                return $this->projects_history;
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
