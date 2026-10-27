<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
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
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'customer_id' => ['required', 'exists:companies,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'project_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_amount' => ['required', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'payment_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'in:Cash,Online,Cheque,Bank Transfer'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurring_interval' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:Pending,Paid,Partially Paid,Overdue,Cancelled'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
