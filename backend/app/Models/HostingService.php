<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class HostingService extends BaseModel
{
    protected $fillable = [
        'service_type',
        'customer_id',
        'provider',
        'cost_price',
        'selling_price',
        'renew_date',
        'encrypted_credentials',
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
        'renew_date' => 'date',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'encrypted_credentials' => 'encrypted',
        'is_delete' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'customer_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'customer_id');
    }

    public function reminders(): MorphMany
    {
        return $this->morphMany(Reminder::class, 'remindable');
    }
}
