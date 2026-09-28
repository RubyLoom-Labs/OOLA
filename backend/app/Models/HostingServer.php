<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class HostingServer extends BaseModel
{
    protected $fillable = [
        'server_name',
        'customer_id',
        'purpose',
        'provider',
        'ip_address',
        'plan',
        'purchase_date',
        'cost_price',
        'selling_price',
        'renew_date',
        'encrypted_credentials',
        'domain_id',
        'status',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $hidden = [
        'encrypted_credentials',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'renew_date' => 'date',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'encrypted_credentials' => 'encrypted',
        'is_delete' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(HostingDomain::class, 'domain_id');
    }

    public function reminders(): MorphMany
    {
        return $this->morphMany(Reminder::class, 'remindable');
    }
}
