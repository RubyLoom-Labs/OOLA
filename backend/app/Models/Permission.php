<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends BaseModel
{
    protected $fillable = [
        'name',
        'slug',
        'module',
        'description',
        'is_delete',
    ];

    protected $casts = [
        'is_delete' => 'boolean',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'permission_role');
    }
}
