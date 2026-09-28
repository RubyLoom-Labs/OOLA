<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'causer_id' => $this->causer_id,
            'causer_name' => $this->causer_name,
            'action' => $this->action,
            'description' => $this->description,
            'properties' => $this->properties,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
