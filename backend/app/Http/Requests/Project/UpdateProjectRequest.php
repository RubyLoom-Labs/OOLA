<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('company_id') && ! $this->has('customer_id')) {
            $this->merge(['customer_id' => $this->input('company_id')]);
        }
        if ($this->has('customer_id') && ! $this->has('company_id')) {
            $this->merge(['company_id' => $this->input('customer_id')]);
        }
        if ($this->has('contact_id') && ! $this->has('contact_ids')) {
            $contactId = $this->input('contact_id');
            $this->merge(['contact_ids' => $contactId ? [$contactId] : []]);
        }
        if ($this->has('priority') && $this->input('priority')) {
            $this->merge(['priority' => str_replace(' Priority', '', $this->input('priority'))]);
        }
    }

    public function rules(): array
    {
        return [
            'project_title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'customer_id' => ['sometimes', 'required', 'exists:companies,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'contact_ids' => ['nullable', 'array'],
            'contact_ids.*' => ['exists:contacts,id'],
            'lead_id' => ['nullable', 'exists:users,id'],
            'project_manager_id' => ['nullable', 'exists:users,id'],
            'stage_id' => ['nullable', 'exists:project_stages,id'],
            'project_type' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'expected_end_date' => ['nullable', 'date'],
            'actual_end_date' => ['nullable', 'date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'quoted_amount' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'revenue' => ['nullable', 'numeric'],
            'profit' => ['nullable', 'numeric'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ];
    }
}
