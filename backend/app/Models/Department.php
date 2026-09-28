<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends BaseModel
{
    protected $fillable = [
        'name',
        'description',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    public function designations(): HasMany
    {
        return $this->hasMany(Designation::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
