<?php

namespace App\Http\Requests\Contact;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_type' => ['nullable', 'string', 'max:100'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owners' => ['nullable', 'array'],
            'owners.*' => ['nullable'],
            'designation' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'owner_phone' => ['nullable', 'string', 'max:50'],
            'owner_residence' => ['nullable', 'string', 'max:255'],
            'residence' => ['nullable', 'string', 'max:255'],
            'owner_birthday' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date'],
            'company_address' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'website' => ['nullable', 'string', 'max:255'],
            'web' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:100'],
            'states' => ['nullable', 'string', 'max:100'],
            'contact_details' => ['nullable'],
            'is_primary' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            
            // Nested phone numbers support
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
