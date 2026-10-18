<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Customer extends BaseModel
{
    protected $fillable = [
        'customer_code',
        'company_name',
        'company_type',
        'designation',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'country',
        'residence',
        'birthday',
        'status',
        'notes',
        'custom_fields',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'birthday' => 'date',
        'custom_fields' => 'array',
        'is_delete' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Customer $customer) {
            if (empty($customer->customer_code) || ! preg_match('/^CUS\d{6}$/', $customer->customer_code)) {
                $customer->customer_code = static::generateCustomerCode();
            }
            if ($customer->status === null) {
                $customer->status = 'Active';
            }
        });

        static::updating(function (Customer $customer) {
            // Immutable: customer_code cannot be edited or updated once set
            if ($customer->isDirty('customer_code')) {
                $customer->customer_code = $customer->getOriginal('customer_code') ?: static::generateCustomerCode();
            }
        });
    }

    /**
     * Generate sequential customer code in ascending order starting with CUS000001.
     */
    public static function generateCustomerCode(): string
    {
        $codes = static::withoutGlobalScopes()
            ->where('customer_code', 'like', 'CUS%')
            ->pluck('customer_code');

        $maxNumber = 0;
        foreach ($codes as $code) {
            if (preg_match('/^CUS(\d+)$/', $code, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNumber) {
                    $maxNumber = $num;
                }
            }
        }

        $nextNumber = $maxNumber + 1;

        do {
            $code = sprintf('CUS%06d', $nextNumber);
            $exists = static::withoutGlobalScopes()->where('customer_code', $code)->exists();
            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $code;
    }

    /**
     * Retrieve the model for a bound value by id or customer_code.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'id', $value)
            ->orWhere('customer_code', $value)
            ->firstOrFail();
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'company_id');
    }

    public function primaryContact(): HasOne
    {
        return $this->hasOne(Contact::class, 'company_id');
    }

    public function phoneNumbers(): HasManyThrough
    {
        return $this->hasManyThrough(ContactPhoneNumber::class, Contact::class, 'company_id', 'contact_id');
    }

    public function primaryPhoneNumber(): HasOneThrough
    {
        return $this->hasOneThrough(ContactPhoneNumber::class, Contact::class, 'company_id', 'contact_id')->where('contact_phone_numbers.is_primary', true);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(HostingDomain::class);
    }

    public function servers(): HasMany
    {
        return $this->hasMany(HostingServer::class);
    }

    public function hostingServices(): HasMany
    {
        return $this->hasMany(HostingService::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
    }
}
