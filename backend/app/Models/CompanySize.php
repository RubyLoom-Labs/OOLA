<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanySize extends BaseModel
{
    protected $table = 'company_sizes';

    protected $fillable = [
        'name',
        'status',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'company_size_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }
}
