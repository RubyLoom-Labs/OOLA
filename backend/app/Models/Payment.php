<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Payment extends BaseModel
{
    protected $fillable = [
        'payment_code',
        'invoice_number',
        'customer_id',
        'project_id',
        'quotation_id',
        'project_amount',
        'payment_amount',
        'paid_amount',
        'outstanding_amount',
        'payment_terms',
        'payment_date',
        'payment_method',
        'receipt_number',
        'is_recurring',
        'recurring_interval',
        'status',
        'notes',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'project_amount' => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'outstanding_amount' => 'decimal:2',
        'is_recurring' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
