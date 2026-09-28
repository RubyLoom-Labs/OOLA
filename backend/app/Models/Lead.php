<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Lead extends BaseModel
{
    protected $fillable = [
        'lead_code',
        'lead_title',
        'requirement_name',
        'requirement_details',
        'customer_id',
        'contact_id',
        'lead_source_id',
        'lead_stage_id',
        'budget_quoted',
        'currency',
        'priority',
        'status',
        'next_step',
        'expected_closing_date',
        'lost_reason',
        'lost_note',
        'lost_at',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'budget_quoted' => 'decimal:2',
        'expected_closing_date' => 'date',
        'lost_at' => 'datetime',
        'is_delete' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(LeadStage::class, 'lead_stage_id');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'lead_source_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lead_users')
            ->withPivot(['role', 'assigned_at'])
            ->withTimestamps();
    }

    public function tasks(): MorphMany
    {
        return $this->morphMany(Task::class, 'taskable');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
    }

    /**
     * Check if a given user is a member of this lead (PRD Rule Section 25).
     */
    public function hasMember(int $userId): bool
    {
        return $this->users()->where('users.id', $userId)->exists();
    }

    /**
     * Total working seconds logged across all tasks under this lead.
     */
    public function getTotalWorkingSecondsAttribute(): int
    {
        $taskIds = $this->tasks()->pluck('id');
        return (int) TaskTimeEntry::whereIn('task_id', $taskIds)->sum('duration_seconds');
    }
}
