<?php

namespace App\Http\Requests\Inquiry;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize common website payload keys (firstname, lastname, contact_number, etc.)
     * before running validation rules.
     */
    protected function prepareForValidation(): void
    {
        $firstName = $this->input('first_name')
            ?? $this->input('firstname')
            ?? $this->input('firstName')
            ?? $this->input('first');

        $lastName = $this->input('last_name')
            ?? $this->input('lastname')
            ?? $this->input('lastName')
            ?? $this->input('last');

        $contactNumber = $this->input('contact_number')
            ?? $this->input('contactNumber')
            ?? $this->input('phone_number')
            ?? $this->input('phone')
            ?? $this->input('contact_no')
            ?? $this->input('mobile');

        $merged = [];

        if ($firstName !== null) {
            $merged['first_name'] = is_string($firstName) ? trim($firstName) : $firstName;
        }
        if ($lastName !== null) {
            $merged['last_name'] = is_string($lastName) ? trim($lastName) : $lastName;
        }
        if ($this->has('email') && is_string($this->input('email'))) {
            $merged['email'] = trim($this->input('email'));
        }
        if ($contactNumber !== null) {
            $merged['contact_number'] = is_string($contactNumber) ? trim($contactNumber) : $contactNumber;
        }
        if ($this->has('subject') && is_string($this->input('subject'))) {
            $merged['subject'] = trim($this->input('subject'));
        }

        if (! empty($merged)) {
            $this->merge($merged);
        }
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:500'],
            'message' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'contact_number.required' => 'Contact number is required.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => $validator->errors()->first() ?: 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}

