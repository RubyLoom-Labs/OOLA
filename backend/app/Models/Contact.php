<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class Contact extends BaseModel
{
    protected $fillable = [
        'company_id',
        'company',
        'first_name',
        'last_name',
        'designation',
        'email',
        'avatar',
        'address',
        'birthday',
        'status',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'birthday' => 'date',
        'is_delete' => 'boolean',
        'status' => 'boolean',
    ];

    /**
     * Get the associated company (Company model).
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * Get the associated customer/company (Customer model).
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * Multiple phone numbers associated with this contact.
     */
    public function phoneNumbers(): HasMany
    {
        return $this->hasMany(ContactPhoneNumber::class);
    }

    /**
     * Associated websites/sites for this contact.
     */
    public function sites(): HasMany
    {
        return $this->hasMany(ContactSite::class, 'contact_id');
    }

    public function contactSites(): HasMany
    {
        return $this->hasMany(ContactSite::class, 'contact_id');
    }

    /**
     * Primary phone number for this contact.
     */
    public function primaryPhoneNumber(): HasOne
    {
        return $this->hasOne(ContactPhoneNumber::class)->where('is_primary', true);
    }

    /**
     * Direct projects assigned to this contact via project_contact pivot.
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_contact')
            ->withTimestamps();
    }

    public function directProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_contact')
            ->withTimestamps();
    }

    /**
     * Leads associated with this contact.
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'contact_id');
    }

    /**
     * Full name accessor.
     */
    public function getFullNameAttribute(): string
    {
        $name = trim("{$this->first_name} {$this->last_name}");
        if (! empty($name)) {
            return $name;
        }

        return $this->company ?? '';
    }

    /**
     * Backward compatibility / alias for company_name attribute.
     */
    public function getCompanyNameAttribute(): ?string
    {
        return $this->company;
    }

    public function setCompanyNameAttribute(?string $value): void
    {
        $this->attributes['company'] = $value;
    }

    /**
     * Backward compatibility / alias for customer_id attribute.
     */
    public function getCustomerIdAttribute(): ?int
    {
        return $this->company_id;
    }

    public function setCustomerIdAttribute(?int $value): void
    {
        $this->attributes['company_id'] = $value;
    }

    /**
     * Get the resolved avatar public URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (empty($this->avatar)) {
            return null;
        }

        return filter_var($this->avatar, FILTER_VALIDATE_URL)
            ? $this->avatar
            : Storage::disk('public')->url($this->avatar);
    }

    /**
     * Get the effective projects count (direct contact projects or through company/customer).
     */
    public function getProjectsCountAttribute(): int
    {
        if ($this->relationLoaded('projects')) {
            return $this->projects->count();
        }

        $directCount = $this->projects()->count();
        if ($directCount > 0) {
            return $directCount;
        }

        if ($this->company_id && $this->relationLoaded('customer') && $this->customer) {
            return $this->customer->projects()->count();
        }

        return $directCount;
    }

    /**
     * Get project history summary list for this contact.
     */
    public function getProjectsHistoryAttribute(): array
    {
        $projects = $this->projects()->with('stage')->latest()->get();
        if ($projects->isEmpty() && $this->company_id) {
            $projects = Project::where('customer_id', $this->company_id)->with('stage')->latest()->get();
        }

        return $projects->map(function (Project $project) {
            return [
                'id' => $project->id,
                'project_code' => $project->project_code,
                'project_title' => $project->project_title,
                'status' => $project->status,
                'stage' => $project->stage?->name,
                'budget' => $project->budget,
                'quoted_amount' => $project->quoted_amount,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'expected_end_date' => $project->expected_end_date?->format('Y-m-d'),
                'created_at' => $project->created_at?->toISOString(),
            ];
        })->toArray();
    }
}
