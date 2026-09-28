<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subtask extends BaseModel
{
    protected $fillable = [
        'task_id',
        'title',
        'is_completed',
        'priority',
        'stage',
        'due_date',
        'assigned_user_id',
        'order_column',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'due_date' => 'datetime',
        'is_delete' => 'boolean',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
