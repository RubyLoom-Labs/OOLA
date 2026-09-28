<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['sometimes', 'required', 'string', 'max:255'],
            'company_type' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'residence' => ['nullable', 'string', 'max:255'],
            'birthday' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:Active,Inactive,Lead,Prospect'],
            'notes' => ['nullable', 'string'],
            'phone_numbers' => ['nullable', 'array'],
            'phone_numbers.*.id' => ['nullable', 'integer'],
            'phone_numbers.*.phone_number' => ['nullable', 'string', 'max:50'],
            'phone_numbers.*.type' => ['nullable', 'string', 'max:50'],
            'phone_numbers.*.is_primary' => ['nullable', 'boolean'],
            'phone_numbers.*.is_whatsapp' => ['nullable', 'boolean'],
            'phone_numbers.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
