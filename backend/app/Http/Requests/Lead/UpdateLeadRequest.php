<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lead_title' => ['sometimes', 'required', 'string', 'max:255'],
            'requirement_name' => ['nullable', 'string', 'max:255'],
            'requirement_details' => ['nullable', 'string'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'lead_source_id' => ['nullable', 'exists:lead_sources,id'],
            'lead_stage_id' => ['nullable', 'exists:lead_stages,id'],
            'budget_quoted' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'status' => ['nullable', 'string', 'in:Active,Won,Lost,Converted'],
            'next_step' => ['nullable', 'string', 'max:255'],
            'expected_closing_date' => ['nullable', 'date'],
            'lost_reason' => ['nullable', 'string', 'max:255'],
            'lost_note' => ['nullable', 'string'],
        ];
    }
}
