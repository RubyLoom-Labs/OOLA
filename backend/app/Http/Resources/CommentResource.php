<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imageUrl = null;
        if (! empty($this->image)) {
            $imageUrl = filter_var($this->image, FILTER_VALIDATE_URL)
                ? $this->image
                : url(Storage::disk('public')->url($this->image));
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'company' => $this->company,
            'title' => $this->title,
            'comment' => $this->comment,
            'image' => $this->image,
            'image_url' => $imageUrl,
            'status' => (int) ((bool) $this->status),
            'display_status' => (int) ((bool) $this->display_status),
            'is_delete' => (int) ((bool) $this->is_delete),
            'created_at' => $this->created_at?->toISOString() ?? $this->created_at,
            'updated_at' => $this->updated_at?->toISOString() ?? $this->updated_at,
        ];
    }
}
