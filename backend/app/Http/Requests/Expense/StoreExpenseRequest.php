<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'category' => ['nullable', 'string', 'max:100'],
            'expense_date' => ['nullable', 'date'],
            'user_id' => ['nullable', 'exists:users,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'description' => ['nullable', 'string'],
        ];
    }
}
