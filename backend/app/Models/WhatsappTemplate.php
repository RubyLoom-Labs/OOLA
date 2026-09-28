<?php

namespace App\Models;

class WhatsappTemplate extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'category',
        'message_body',
        'variables',
        'status',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_delete' => 'boolean',
    ];
}
