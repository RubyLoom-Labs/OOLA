<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Contact extends BaseModel
{
    protected $fillable = [
        'customer_id',
        'company_name',
        'company_type',
        'owner_name',
        'owners',
        'first_name',
        'last_name',
        'designation',
        'email',
        'owner_email',
        'phone',
        'owner_phone',
        'owner_residence',
        'owner_birthday',
        'company_address',
        'website',
        'state',
        'contact_details',
        'is_primary',
        'notes',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'owners' => 'array',
        'owner_birthday' => 'date',
        'contact_details' => 'array',
        'is_primary' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function phoneNumbers(): HasMany
    {
        return $this->hasMany(ContactPhoneNumber::class);
    }

    public function primaryPhoneNumber(): HasOne
    {
        return $this->hasOne(ContactPhoneNumber::class)->where('is_primary', true);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'contact_id');
    }

    public function directProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'contact_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'contact_id');
    }

    public function getFullNameAttribute(): string
    {
        $name = trim("{$this->first_name} {$this->last_name}");
        if (!empty($name)) {
            return $name;
        }

        if (!empty($this->owner_name)) {
            return $this->owner_name;
        }

        return $this->company_name ?? '';
    }

    /**
     * Get the effective projects count (direct contact projects or through customer).
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

        if ($this->customer_id && $this->relationLoaded('customer') && $this->customer) {
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
        if ($projects->isEmpty() && $this->customer_id) {
            $projects = Project::where('customer_id', $this->customer_id)->with('stage')->latest()->get();
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

    /**
     * Helper to append an owner to the owners array.
     */
    public function addOwner(array|string $owner): void
    {
        $currentOwners = $this->owners ?? [];
        $currentOwners[] = $owner;
        $this->owners = $currentOwners;
        $this->save();
    }
}
