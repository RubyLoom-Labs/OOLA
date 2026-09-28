<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Reminder extends BaseModel
{
    protected $fillable = [
        'remindable_type',
        'remindable_id',
        'user_id',
        'reminder_type',
        'remind_at',
        'status',
        'notification_sent',
        'email_sent',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'remind_at' => 'datetime',
        'notification_sent' => 'boolean',
        'email_sent' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function remindable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
