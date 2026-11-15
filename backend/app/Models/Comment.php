<?php

namespace App\Models;

use App\Traits\HasIsDelete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory, HasIsDelete;

    protected $table = 'comments';

    protected $fillable = [
        'name',
        'company',
        'title',
        'comment',
        'image',
        'status',
        'display_status',
        'is_delete',
    ];

    protected $casts = [
        'status' => 'boolean',
        'display_status' => 'boolean',
        'is_delete' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Logical delete method setting is_delete = true without requiring deleted_at column.
     */
    public function logicalDelete(): bool
    {
        $this->is_delete = true;

        return $this->saveQuietly();
    }

    /**
     * Restore logically deleted record.
     */
    public function restore(): bool
    {
        $this->is_delete = false;

        return $this->saveQuietly();
    }
}
