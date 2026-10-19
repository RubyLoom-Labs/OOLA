<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class ProjectPriority extends BaseModel
{
    protected $table = 'project_priorities';

    protected $fillable = [
        'name',
        'order_column',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'order_column' => 'integer',
        'is_delete' => 'boolean',
    ];

    /**
     * Scope a query to only include active records (is_delete = 0).
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_delete', false);
    }
}
