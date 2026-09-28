<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class StoreCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'customer_id' => ['nullable', 'exists:customers,id'],
            'lead_id' => ['nullable', 'exists:leads,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
        ];
    }
}
