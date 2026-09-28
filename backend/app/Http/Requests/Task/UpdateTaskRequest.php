<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_type' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'task_stage_id' => ['nullable', 'exists:task_stages,id'],
            'status' => ['nullable', 'string', 'in:Pending,In Progress,In Review,Completed,Overdue'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'actual_minutes' => ['nullable', 'integer', 'min:0'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ];
    }
}
