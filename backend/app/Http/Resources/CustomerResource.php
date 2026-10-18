<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $code = $this->customer_code ?? $this->company_code;
        $name = $this->company_name;
        $phone = $this->phone ?? $this->phone_number;
        $address = $this->address ?? $this->address_line_1;
        $status = is_bool($this->status) ? ($this->status ? 'Active' : 'Inactive') : ($this->status ?? 'Active');

        return [
            'id' => $this->id,
            'customer_code' => $code,
            'company_code' => $this->company_code ?? $code,
            'company_name' => $name,
            'company_type' => $this->company_type ?? ($this->relationLoaded('companyType') && $this->companyType ? $this->companyType->name : null),
            'designation' => $this->designation,
            'email' => $this->email,
            'phone' => $phone,
            'phone_number' => $this->phone_number ?? $phone,
            'website' => $this->website,
            'address' => $address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'residence' => $this->residence,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'status' => $status,
            'notes' => $this->notes ?? $this->company_description,
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
