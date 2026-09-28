<?php

namespace App\Models;

class EmailTemplate extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'subject',
        'body_html',
        'variables',
        'is_active',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
        'is_delete' => 'boolean',
    ];
}
