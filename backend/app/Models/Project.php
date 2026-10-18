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

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->project_code)) {
                $project->project_code = static::generateProjectCode($project->customer_id);
            }
        });
    }

    /**
     * Generate project code:
     * Starts with PROJ, followed by companyCode without 'C' character,
     * followed by sequential project number for that company (1, 2, ...).
     * Example: PROJO0000011, PROJO0000012, PROJO0000021.
     */
    public static function generateProjectCode(int|string|Company|null $company = null): string
    {
        $companyCode = null;
        $companyId = null;

        if ($company instanceof Company) {
            $companyCode = $company->company_code;
            $companyId = $company->id;
        } elseif (! empty($company)) {
            if (is_numeric($company)) {
                $companyModel = Company::find($company);
                if ($companyModel) {
                    $companyCode = $companyModel->company_code;
                    $companyId = $companyModel->id;
                }
            } elseif (is_string($company)) {
                if (str_starts_with(strtoupper($company), 'CO')) {
                    $companyCode = $company;
                } else {
                    $companyModel = Company::find($company);
                    if ($companyModel) {
                        $companyCode = $companyModel->company_code;
                        $companyId = $companyModel->id;
                    }
                }
            }
        }

        if (empty($companyCode)) {
            $fallbackCompany = Company::orderBy('id', 'asc')->first();
            $companyCode = $fallbackCompany?->company_code ?? 'CO000001';
            $companyId = $fallbackCompany?->id;
        }

        // Remove 'C' character from company code (e.g., CO000001 -> O000001)
        $cleanCompanyCode = str_ireplace('C', '', $companyCode);

        $prefix = 'PROJ'.$cleanCompanyCode;

        // Find the maximum project sequence number for this prefix
        $maxNumber = 0;

        $existingCodes = static::withTrashed()
            ->where(function ($query) use ($prefix, $companyId) {
                $query->where('project_code', 'like', "{$prefix}%");
                if ($companyId) {
                    $query->orWhere('customer_id', $companyId);
                }
            })
            ->pluck('project_code');

        foreach ($existingCodes as $existingCode) {
            if (preg_match('/^'.preg_quote($prefix, '/').'(\d+)$/', $existingCode, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNumber) {
                    $maxNumber = $num;
                }
            }
        }

        $nextNumber = $maxNumber + 1;

        // Ensure uniqueness loop
        do {
            $code = $prefix.$nextNumber;
            $exists = static::withTrashed()->where('project_code', $code)->exists();
            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $code;
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'customer_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'customer_id');
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
