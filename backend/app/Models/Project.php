<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Project extends BaseModel
{
    protected $fillable = [
        'project_code',
        'project_title',
        'description',
        'customer_id',
        'contact_id',
        'lead_id',
        'project_manager_id',
        'stage_id',
        'project_type',
        'priority',
        'status',
        'start_date',
        'expected_end_date',
        'actual_end_date',
        'budget',
        'quoted_amount',
        'cost',
        'revenue',
        'profit',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expected_end_date' => 'date',
        'actual_end_date' => 'date',
        'budget' => 'decimal:2',
        'quoted_amount' => 'decimal:2',
        'cost' => 'decimal:2',
        'revenue' => 'decimal:2',
        'profit' => 'decimal:2',
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

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(ProjectStage::class, 'stage_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_users')
            ->withPivot(['role', 'assigned_at'])
            ->withTimestamps();
    }

    public function tasks(): MorphMany
    {
        return $this->morphMany(Task::class, 'taskable');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    /**
     * Check if a given user is a member of this project (PRD Rule Section 25).
     */
    public function hasMember(int $userId): bool
    {
        if ($this->project_manager_id === $userId) {
            return true;
        }

        return $this->users()->where('users.id', $userId)->exists();
    }

    /**
     * Outstanding payments balance for this project.
     */
    public function getOutstandingBalanceAttribute(): float
    {
        $totalPaid = (float) $this->payments()->where('status', 'Paid')->sum('paid_amount');
        return max(0, (float) $this->quoted_amount - $totalPaid);
    }

    /**
     * Profit margin percentage.
     */
    public function getProfitMarginAttribute(): float
    {
        if ($this->revenue <= 0) {
            return 0.0;
        }

        return round((($this->profit) / $this->revenue) * 100, 2);
    }
}
