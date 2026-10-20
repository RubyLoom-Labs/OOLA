<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
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
        if ($this->has('priority') && $this->input('priority')) {
            $this->merge(['priority' => str_replace(' Priority', '', $this->input('priority'))]);
        }
    }

    public function rules(): array
    {
        return [
            'project_code' => ['nullable', 'string', 'max:100', 'unique:projects,project_code'],
            'project_title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'customer_id' => ['required', 'exists:companies,id'],
            'lead_id' => ['nullable', 'exists:users,id'],
            'project_manager_id' => ['nullable', 'exists:users,id'],
            'stage_id' => ['nullable', 'exists:project_stages,id'],
            'project_type' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent,Low Priority,Medium Priority,High Priority,Urgent Priority'],
            'status' => ['nullable', 'string', 'in:Not Started,In Progress,On Hold,Completed,Cancelled'],
            'start_date' => ['nullable', 'date'],
            'expected_end_date' => ['nullable', 'date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'quoted_amount' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ];
    }
}
