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
            'lead' => new UserResource($this->whenLoaded('lead')),
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
            'contact_id' => $this->relationLoaded('contacts') ? $this->contacts->first()?->id : null,
            'contact_ids' => $this->relationLoaded('contacts')
                ? $this->contacts->pluck('id')->values()->all()
                : $this->contacts()->pluck('contacts.id')->values()->all(),
            'contacts' => ContactResource::collection($this->whenLoaded('contacts')),
            'users' => UserResource::collection($this->whenLoaded('users')),
            'attachments' => $this->relationLoaded('attachments') ? $this->attachments->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'project_id' => $doc->project_id,
                    'document_name' => $doc->document_name,
                    'document_title' => $doc->document_name,
                    'file_name' => $doc->document_name,
                    'type' => $doc->type,
                    'category' => $doc->type,
                    'file_path' => $doc->file_path,
                    'mime_type' => $doc->mime_type,
                    'file_size' => (int) $doc->file_size,
                    'upload_user_id' => $doc->upload_user_id,
                    'uploaded_by' => $doc->upload_user_id,
                    'is_delete' => (bool) $doc->is_delete,
                    'uploader' => $doc->relationLoaded('uploader') && $doc->uploader ? [
                        'id' => $doc->uploader->id,
                        'name' => $doc->uploader->name,
                        'email' => $doc->uploader->email,
                    ] : null,
                    'created_at' => $doc->created_at?->toISOString(),
                    'updated_at' => $doc->updated_at?->toISOString(),
                ];
            }) : [],
            'documents' => $this->relationLoaded('attachments') ? $this->attachments->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'project_id' => $doc->project_id,
                    'document_name' => $doc->document_name,
                    'document_title' => $doc->document_name,
                    'file_name' => $doc->document_name,
                    'type' => $doc->type,
                    'category' => $doc->type,
                    'file_path' => $doc->file_path,
                    'mime_type' => $doc->mime_type,
                    'file_size' => (int) $doc->file_size,
                    'upload_user_id' => $doc->upload_user_id,
                    'uploaded_by' => $doc->upload_user_id,
                    'is_delete' => (bool) $doc->is_delete,
                    'uploader' => $doc->relationLoaded('uploader') && $doc->uploader ? [
                        'id' => $doc->uploader->id,
                        'name' => $doc->uploader->name,
                        'email' => $doc->uploader->email,
                    ] : null,
                    'created_at' => $doc->created_at?->toISOString(),
                    'updated_at' => $doc->updated_at?->toISOString(),
                ];
            }) : [],
            'tasks_count' => $this->tasks_count,
            'payments_count' => $this->payments_count,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
