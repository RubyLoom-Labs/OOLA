<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactSite extends BaseModel
{
    protected $table = 'contact_sites';

    protected $fillable = [
        'contact_id',
        'name',
        'url',
        'is_delete',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'is_delete' => 'boolean',
        'status' => 'boolean',
    ];

    /**
     * Get the contact that owns this site.
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }
}
