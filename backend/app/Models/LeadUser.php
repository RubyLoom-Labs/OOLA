<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class LeadUser extends Pivot
{
    protected $table = 'lead_users';

    protected $fillable = [
        'lead_id',
        'user_id',
        'role',
        'assigned_at',
        'created_by',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
