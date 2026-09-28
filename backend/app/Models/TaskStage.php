<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskStage extends BaseModel
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

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
