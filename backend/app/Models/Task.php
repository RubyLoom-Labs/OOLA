<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Task extends BaseModel
{
    protected $fillable = [
        'task_code',
        'title',
        'description',
        'task_type',
        'priority',
        'task_stage_id',
        'status',
        'taskable_type',
        'taskable_id',
        'start_date',
        'due_date',
        'estimated_minutes',
        'actual_minutes',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'due_date' => 'datetime',
        'estimated_minutes' => 'integer',
        'actual_minutes' => 'integer',
        'is_delete' => 'boolean',
    ];

    public function taskable(): MorphTo
    {
        return $this->morphTo();
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(TaskStage::class, 'task_stage_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_users')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class)->orderBy('order_column');
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TaskTimeEntry::class);
    }

    public function runningTimeEntry()
    {
        return $this->hasOne(TaskTimeEntry::class)->where('is_running', true)->latest();
    }

    public function reminders(): MorphMany
    {
        return $this->morphMany(Reminder::class, 'remindable');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    /**
     * Calculate total tracked seconds for this task.
     */
    public function getTotalTrackedSecondsAttribute(): int
    {
        return (int) $this->timeEntries()->sum('duration_seconds');
    }
}
