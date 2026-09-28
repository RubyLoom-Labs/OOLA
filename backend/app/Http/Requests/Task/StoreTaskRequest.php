<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
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
            'task_type' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'task_stage_id' => ['nullable', 'exists:task_stages,id'],
            'status' => ['nullable', 'string', 'in:Pending,In Progress,In Review,Completed,Overdue'],
            'taskable_type' => ['nullable', 'string'],
            'taskable_id' => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ];
    }
}
