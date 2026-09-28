<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HostingDomainResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'domain_name' => $this->domain_name,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'contact_id' => $this->contact_id,
            'provider' => $this->provider,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'cost_price' => (float)$this->cost_price,
            'selling_price' => (float)$this->selling_price,
            'renew_date' => $this->renew_date?->format('Y-m-d'),
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
