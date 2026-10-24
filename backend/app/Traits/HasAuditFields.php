<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait HasAuditFields
{
    /**
     * Boot the audit fields trait.
     */
    public static function bootHasAuditFields(): void
    {
        static::creating(function (Model $model) {
            if (Auth::check() && empty($model->created_by)) {
                if (in_array('created_by', $model->getFillable()) || \Illuminate\Support\Facades\Schema::hasColumn($model->getTable(), 'created_by')) {
                    $model->created_by = Auth::id();
                }
            }
        });

        static::updating(function (Model $model) {
            if (Auth::check() && $model->isDirty()) {
                if (in_array('updated_by', $model->getFillable()) || \Illuminate\Support\Facades\Schema::hasColumn($model->getTable(), 'updated_by')) {
                    $model->updated_by = Auth::id();
                }
            }
        });
    }

    /**
     * User who created the record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who last updated the record.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * User who logically deleted the record.
     */
    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
