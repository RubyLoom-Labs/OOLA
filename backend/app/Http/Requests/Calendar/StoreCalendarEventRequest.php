<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class StoreCalendarEventRequest extends FormRequest
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
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_time' => ['required', 'date'],
            'end_time' => ['nullable', 'date'],
            'event_type' => ['nullable', 'string', 'max:50'],
            'is_all_day' => ['nullable', 'boolean'],
            'location' => ['nullable', 'string', 'max:255'],
            'reminder_before_minutes' => ['nullable', 'integer'],
            'customer_id' => ['nullable', 'exists:companies,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'lead_id' => ['nullable', 'exists:leads,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
        ];
    }
}
