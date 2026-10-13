<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmNotification extends BaseModel
{
    protected $fillable = [
        'user_id',
        'title',
        'message',
        'action_url',
        'type',
        'is_read',
        'read_at',
        'is_delete',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'is_delete' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): bool
    {
        $this->is_read = true;
        $this->read_at = now();

        return $this->save();
    }
}
