<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $company = $this->relationLoaded('customer')
            ? $this->customer
            : ($this->relationLoaded('company') ? $this->company : ($this->customer_id ? $this->customer : null));

        return [
            'id' => $this->id,
            'project_code' => $this->project_code,
            'project_title' => $this->project_title,
            'description' => $this->description,
            'customer_id' => $this->customer_id,
            'company_id' => $this->customer_id,
            'customer' => $company ? [
                'id' => $company->id,
                'customer_code' => $company->company_code ?? null,
                'company_code' => $company->company_code ?? null,
                'company_name' => $company->company_name ?? null,
                'name' => $company->company_name ?? null,
                'company_type_id' => $company->company_type_id ?? null,
                'company_type' => $company->relationLoaded('companyType') && $company->companyType ? $company->companyType->name : null,
                'email' => $company->email ?? null,
                'phone' => $company->phone_number ?? null,
                'phone_number' => $company->phone_number ?? null,
                'website' => $company->website ?? null,
                'logo' => $company->logo ?? null,
                'logo_url' => $company->logo_url ?? null,
                'address' => $company->address_line_1 ?? null,
                'city' => $company->city ?? null,
                'state' => $company->state ?? null,
                'country' => $company->country ?? null,
                'status' => (bool) ($company->status ?? true) ? 'Active' : 'Inactive',
                'status_bool' => (bool) ($company->status ?? true),
            ] : null,
            'company' => $company ? new CompanyResource($company) : null,
            'lead_id' => $this->lead_id,
            'project_manager_id' => $this->project_manager_id,
            'manager' => new UserResource($this->whenLoaded('manager')),
            'stage_id' => $this->stage_id,
            'stage' => $this->whenLoaded('stage'),
            'project_type' => $this->project_type,
            'priority' => $this->priority,
            'status' => $this->status,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'expected_end_date' => $this->expected_end_date?->format('Y-m-d'),
            'actual_end_date' => $this->actual_end_date?->format('Y-m-d'),
            'budget' => (float) $this->budget,
            'quoted_amount' => (float) $this->quoted_amount,
            'cost' => (float) $this->cost,
            'revenue' => (float) $this->revenue,
            'profit' => (float) $this->profit,
            'users' => UserResource::collection($this->whenLoaded('users')),
            'tasks_count' => $this->tasks_count,
            'payments_count' => $this->payments_count,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
