<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactPhoneNumber extends BaseModel
{
    protected $table = 'contact_phone_numbers';

    protected $fillable = [
        'contact_id',
        'country_code',
        'phone_number',
        'type',
        'is_primary',
        'is_whatsapp',
        'notes',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_whatsapp' => 'boolean',
        'is_delete' => 'boolean',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
