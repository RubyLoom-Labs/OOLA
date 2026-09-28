<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class QuotationTemplate extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'layout_json',
        'is_active',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'layout_json' => 'array',
        'is_active' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function versions(): HasMany
    {
        return $this->hasMany(QuotationTemplateVersion::class, 'template_id');
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class, 'template_id');
    }
}
