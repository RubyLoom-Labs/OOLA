<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $logoUrl = null;
        if (! empty($this->logo)) {
            $logoUrl = filter_var($this->logo, FILTER_VALIDATE_URL) ? $this->logo : Storage::disk('public')->url($this->logo);
        }

        return [
            'id' => $this->id,
            'customer_id' => $this->id,
            'customerId' => $this->id,
            'company_code' => $this->company_code,
            'customer_code' => $this->company_code,
            'company_name' => $this->company_name,
            'name' => $this->company_name,
            'company_type_id' => $this->company_type_id,
            'company_type' => new CompanyTypeResource($this->whenLoaded('companyType')),
            'email' => $this->email,
            'phone_number' => $this->phone_number,
            'industry' => $this->industry,
            'company_size_id' => $this->company_size_id,
            'company_size' => new CompanySizeResource($this->whenLoaded('companySize')),
            'status' => (bool) $this->status,
            'company_description' => $this->company_description,
            'website' => $this->website,
            'logo' => $this->logo,
            'logo_url' => $logoUrl,
            'owner_name' => $this->owner_name,
            'owner_birthday' => $this->owner_birthday?->format('Y-m-d'),
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'contacts' => ContactResource::collection($this->whenLoaded('contacts')),
            'contacts_count' => $this->when(isset($this->contacts_count), $this->contacts_count),
            'leads_count' => $this->when(isset($this->leads_count), $this->leads_count),
            'projects_count' => $this->when(isset($this->projects_count), $this->projects_count),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
