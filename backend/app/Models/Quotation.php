<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Quotation extends BaseModel
{
    protected $fillable = [
        'quotation_number',
        'title',
        'customer_id',
        'project_id',
        'lead_id',
        'template_id',
        'template_version_id',
        'quotation_date',
        'valid_until',
        'currency',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'terms_conditions',
        'notes',
        'status',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'quotation_date' => 'date',
        'valid_until' => 'date',
        'subtotal' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
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

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(QuotationTemplate::class, 'template_id');
    }

    public function templateVersion(): BelongsTo
    {
        return $this->belongsTo(QuotationTemplateVersion::class, 'template_version_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('order_column');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    /**
     * Recalculate quotation financial totals.
     */
    public function recalculateTotals(): void
    {
        $this->subtotal = (float) $this->items()->sum('total');

        if ($this->discount_type === 'percentage') {
            $this->discount_amount = ($this->subtotal * $this->discount_value) / 100;
        } else {
            $this->discount_amount = min($this->subtotal, (float) $this->discount_value);
        }

        $taxableAmount = max(0, $this->subtotal - $this->discount_amount);
        $this->tax_amount = ($taxableAmount * $this->tax_rate) / 100;
        $this->total_amount = $taxableAmount + $this->tax_amount;

        $this->saveQuietly();
    }
}
