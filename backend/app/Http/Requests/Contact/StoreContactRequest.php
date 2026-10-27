<?php

namespace App\Http\Requests\Contact;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Map frontend customer_id / customerId onto company_id (companies).
     */
    protected function prepareForValidation(): void
    {
        $companyId = $this->input('company_id') ?? $this->input('customer_id') ?? $this->input('customerId') ?? $this->input('companyId');
        if ($companyId !== null && $companyId !== '') {
            $this->merge([
                'company_id' => (int) $companyId,
                'customer_id' => (int) $companyId,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'customer_id' => ['nullable', 'integer', 'exists:companies,id'],
            'customerId' => ['nullable', 'integer', 'exists:companies,id'],
            'companyId' => ['nullable', 'integer', 'exists:companies,id'],
            'company' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'avatar' => ['nullable'],
            'phone' => ['nullable', 'string', 'max:50'],
            'phone_country_code' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'birthday' => ['nullable', 'date'],
            'status' => ['nullable', 'boolean'],

            // Nested sites support
            'sites' => ['nullable', 'array'],
            'sites.*.id' => ['nullable', 'integer'],
            'sites.*.name' => ['nullable', 'string', 'max:255'],
            'sites.*.url' => ['nullable', 'string', 'max:500'],
            'sites.*.is_delete' => ['nullable', 'boolean'],
            'sites.*.status' => ['nullable', 'boolean'],

            // Nested phone numbers support
            'phone_numbers' => ['nullable', 'array'],
            'phone_numbers.*.id' => ['nullable', 'integer'],
            'phone_numbers.*.country_code' => ['nullable', 'string', 'max:20'],
            'phone_numbers.*.phone_number' => ['nullable', 'string', 'max:50'],
            'phone_numbers.*.type' => ['nullable', 'string', 'max:50'],
            'phone_numbers.*.is_primary' => ['nullable', 'boolean'],
            'phone_numbers.*.is_whatsapp' => ['nullable', 'boolean'],
            'phone_numbers.*.notes' => ['nullable', 'string', 'max:255'],
            'phone_numbers.*.is_delete' => ['nullable', 'boolean'],
        ];
    }
}
