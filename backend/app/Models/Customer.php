<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
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

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'company_id');
    }

    public function primaryContact()
    {
        return $this->hasOne(Contact::class)->where('is_primary', true);
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
