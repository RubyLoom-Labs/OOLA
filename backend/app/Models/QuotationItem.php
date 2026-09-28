<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends BaseModel
{
    protected $fillable = [
        'quotation_id',
        'item_name',
        'description',
        'quantity',
        'unit_price',
        'discount',
        'tax_rate',
        'total',
        'order_column',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'total' => 'decimal:2',
        'order_column' => 'integer',
        'is_delete' => 'boolean',
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }
}
