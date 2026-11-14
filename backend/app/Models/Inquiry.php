<?php

namespace App\Models;

class Inquiry extends BaseModel
{
    protected $table = 'inquiries';

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'contact_number',
        'subject',
        'message',
        'status',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_delete' => 'boolean',
    ];
}

