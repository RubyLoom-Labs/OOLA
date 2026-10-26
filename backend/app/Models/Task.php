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
        'project_id',
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

    protected static function booted(): void
    {
        static::saving(function (Task $task) {
            if (! empty($task->taskable_type)) {
                $type = strtolower((string) $task->taskable_type);
                if ($type === 'project' || $task->taskable_type === Project::class) {
                    $task->taskable_type = Project::class;
                    if (! empty($task->taskable_id) && empty($task->project_id)) {
                        $task->project_id = $task->taskable_id;
                    }
                } elseif ($type === 'lead' || $task->taskable_type === Lead::class) {
                    $task->taskable_type = Lead::class;
                }
            }

            if (! empty($task->project_id) && empty($task->taskable_id)) {
                $task->taskable_type = Project::class;
                $task->taskable_id = $task->project_id;
            } elseif (! empty($task->taskable_id) && ($task->taskable_type === Project::class || strtolower((string) $task->taskable_type) === 'project') && empty($task->project_id)) {
                $task->project_id = $task->taskable_id;
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

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
