<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quotation_number' => $this->quotation_number,
            'title' => $this->title,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'project' => $this->whenLoaded('project'),
            'lead' => $this->whenLoaded('lead'),
            'template' => $this->whenLoaded('template'),
            'quotation_date' => $this->quotation_date?->format('Y-m-d'),
            'valid_until' => $this->valid_until?->format('Y-m-d'),
            'currency' => $this->currency,
            'subtotal' => (float) $this->subtotal,
            'discount_type' => $this->discount_type,
            'discount_value' => (float) $this->discount_value,
            'discount_amount' => (float) $this->discount_amount,
            'tax_rate' => (float) $this->tax_rate,
            'tax_amount' => (float) $this->tax_amount,
            'total_amount' => (float) $this->total_amount,
            'terms_conditions' => $this->terms_conditions,
            'notes' => $this->notes,
            'status' => $this->status,
            'items' => $this->whenLoaded('items'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
