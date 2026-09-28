<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Attachment extends BaseModel
{
    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'uploaded_by',
        'is_delete',
        'deleted_at',
        'deleted_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_delete' => 'boolean',
    ];

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
