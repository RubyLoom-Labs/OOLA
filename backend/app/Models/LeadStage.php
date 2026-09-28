<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadStage extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'color',
        'order_column',
        'is_won',
        'is_lost',
        'is_delete',
    ];

    protected $casts = [
        'is_won' => 'boolean',
        'is_lost' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}
