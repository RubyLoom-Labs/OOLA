<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationTemplateVersion extends BaseModel
{
    protected $fillable = [
        'template_id',
        'version_number',
        'structure_json',
        'notes',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'structure_json' => 'array',
        'version_number' => 'integer',
        'is_delete' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(QuotationTemplate::class, 'template_id');
    }
}
