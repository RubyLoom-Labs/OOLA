<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Company extends BaseModel
{
    protected $table = 'companies';

    protected $fillable = [
        'company_code',
        'company_name',
        'company_type_id',
        'email',
        'phone_number',
        'industry',
        'company_size_id',
        'status',
        'company_description',
        'website',
        'logo',
        'owner_name',
        'owner_birthday',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'status' => 'boolean',
        'owner_birthday' => 'date',
        'is_delete' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Company $company) {
            if (empty($company->company_code)) {
                $company->company_code = static::generateCompanyCode();
            }
            if ($company->status === null) {
                $company->status = true;
            }
        });
    }

    /**
     * Generate sequential company code in ascending order starting with CO000001.
     */
    public static function generateCompanyCode(): string
    {
        $latest = static::withTrashed()
            ->where('company_code', 'like', 'CO%')
            ->orderBy('id', 'desc')
            ->value('company_code');

        if ($latest && preg_match('/^CO(\d+)$/', $latest, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        } else {
            $count = static::withTrashed()->count();
            $nextNumber = $count + 1;
        }

        // Ensure uniqueness loop
        do {
            $code = sprintf('CO%06d', $nextNumber);
            $exists = static::withTrashed()->where('company_code', $code)->exists();
            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $code;
    }

    public function companyType(): BelongsTo
    {
        return $this->belongsTo(CompanyType::class, 'company_type_id');
    }

    public function companySize(): BelongsTo
    {
        return $this->belongsTo(CompanySize::class, 'company_size_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'company_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'customer_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'customer_id');
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class, 'customer_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'customer_id');
    }

    public function domains(): HasMany
    {
        return $this->hasMany(HostingDomain::class, 'customer_id');
    }

    public function servers(): HasMany
    {
        return $this->hasMany(HostingServer::class, 'customer_id');
    }

    public function hostingServices(): HasMany
    {
        return $this->hasMany(HostingService::class, 'customer_id');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class, 'customer_id');
    }
}
