<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['sometimes', 'required', 'string', 'max:255'],
            'company_type_id' => ['sometimes', 'required', 'integer', 'exists:company_types,id'],
            'email' => ['sometimes', 'required', 'email', 'max:255'],
            'industry' => ['nullable', 'string', 'max:100'],
            'company_size_id' => ['nullable', 'integer', 'exists:company_sizes,id'],
            'status' => ['nullable', 'boolean'],
            'company_description' => ['nullable', 'string'],
            'website' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owner_birthday' => ['nullable', 'date'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            
            // Multiple contact numbers
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
