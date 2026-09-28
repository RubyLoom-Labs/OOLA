<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_code' => $this->payment_code,
            'invoice_number' => $this->invoice_number,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'project_id' => $this->project_id,
            'project' => new ProjectResource($this->whenLoaded('project')),
            'quotation_id' => $this->quotation_id,
            'project_amount' => (float)$this->project_amount,
            'payment_amount' => (float)$this->payment_amount,
            'paid_amount' => (float)$this->paid_amount,
            'outstanding_amount' => (float)$this->outstanding_amount,
            'payment_terms' => $this->payment_terms,
            'payment_date' => $this->payment_date?->format('Y-m-d'),
            'payment_method' => $this->payment_method,
            'receipt_number' => $this->receipt_number,
            'is_recurring' => $this->is_recurring,
            'recurring_interval' => $this->recurring_interval,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
