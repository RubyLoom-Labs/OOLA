<?php

namespace App\Http\Resources;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $companyRelation = $this->relationLoaded('company') && $this->getRelation('company') instanceof Company
            ? $this->getRelation('company')
            : null;

        // Resolve company name concisely
        $companyName = is_string($this->company) && !empty($this->company)
            ? $this->company
            : ($companyRelation?->company_name ?? ($this->relationLoaded('customer') && $this->getRelation('customer') ? $this->getRelation('customer')->company_name : null));

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company_name' => $companyName,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'designation' => $this->designation,
            'website' => $this->website,
            'address' => $this->address,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'status' => $this->status ?? 'Active',
            'phone_numbers' => ContactPhoneNumberResource::collection($this->whenLoaded('phoneNumbers')),
            'primary_phone_number' => new ContactPhoneNumberResource($this->whenLoaded('primaryPhoneNumber')),
            
            // Detailed company and projects info when loaded (e.g. GET /api/v1/contacts/{id})
            'company' => $this->when($companyRelation !== null, function () use ($companyRelation) {
                return new CompanyResource($companyRelation);
            }),
            'projects' => $this->when($this->relationLoaded('directProjects') || $this->relationLoaded('projects') || $companyRelation !== null, function () {
                return $this->projects_history;
            }),
            'projects_count' => $this->when($this->relationLoaded('directProjects') || $this->relationLoaded('projects') || $companyRelation !== null, function () {
                return $this->projects_count;
            }),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
