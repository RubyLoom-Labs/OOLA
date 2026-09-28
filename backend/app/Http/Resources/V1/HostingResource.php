<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HostingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'domain_name' => $this->domain_name ?? $this->server_name ?? $this->service_type,
            'type' => isset($this->domain_name) ? 'domain' : (isset($this->server_name) ? 'server' : 'service'),
            'provider' => $this->provider,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'cost_price' => (float) $this->cost_price,
            'selling_price' => (float) $this->selling_price,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'renew_date' => $this->renew_date?->format('Y-m-d'),
            'status' => $this->status,
            'days_until_renewal' => $this->renew_date ? now()->diffInDays($this->renew_date, false) : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
