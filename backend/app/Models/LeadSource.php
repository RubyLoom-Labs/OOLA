<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadSource extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'is_active',
        'is_delete',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}
