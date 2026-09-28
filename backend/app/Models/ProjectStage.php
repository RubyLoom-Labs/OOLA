<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectStage extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'color',
        'order_column',
        'is_completed',
        'is_delete',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'stage_id');
    }
}
