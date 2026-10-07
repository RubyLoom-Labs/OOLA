<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use App\Traits\HasIsDelete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class BaseModel extends Model
{
    use HasAuditFields, HasFactory, HasIsDelete;

    /**
     * Default casts for all models.
     */
    protected $casts = [
        'is_delete' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function getCasts(): array
    {
        return array_merge([
            'is_delete' => 'boolean',
        ], parent::getCasts());
    }
}
