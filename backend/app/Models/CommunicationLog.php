<?php

namespace App\Models;

class CommunicationLog extends BaseModel
{
    protected $fillable = [
        'channel',
        'template_id',
        'recipient',
        'subject',
        'content',
        'status',
        'sent_at',
        'external_message_id',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'is_delete' => 'boolean',
    ];
}
