<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class IsDeleteScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where($model->qualifyColumn('is_delete'), false);
    }

    /**
     * Extend the query builder with the needed functions.
     */
    public function extend(Builder $builder): void
    {
        $builder->macro('withTrashed', function (Builder $builder) {
            return $builder->withoutGlobalScope($this);
        });

        $builder->macro('withoutTrashed', function (Builder $builder) {
            return $builder->withoutGlobalScope($this)->where($builder->getModel()->qualifyColumn('is_delete'), false);
        });

        $builder->macro('onlyTrashed', function (Builder $builder) {
            return $builder->withoutGlobalScope($this)->where($builder->getModel()->qualifyColumn('is_delete'), true);
        });

        $builder->macro('restore', function (Builder $builder) {
            return $builder->withTrashed()->update([
                'is_delete' => false,
                'deleted_at' => null,
                'deleted_by' => null,
            ]);
        });
    }
}

trait HasIsDelete
{
    /**
     * Boot the soft-delete equivalent is_delete trait.
     */
    public static function bootHasIsDelete(): void
    {
        static::addGlobalScope(new IsDeleteScope);

        static::deleting(function (Model $model) {
            // Perform logical deletion instead of physical deletion
            $model->is_delete = true;
            $model->deleted_at = now();
            if (Auth::check() && in_array('deleted_by', $model->getFillable())) {
                $model->deleted_by = Auth::id();
            }
            $model->saveQuietly();

            // Fire deleted events but prevent actual SQL DELETE
            return false;
        });
    }

    /**
     * Logical delete method.
     */
    public function logicalDelete(): bool
    {
        $this->is_delete = true;
        $this->deleted_at = now();
        if (Auth::check() && (in_array('deleted_by', $this->getFillable()) || isset($this->deleted_by))) {
            $this->deleted_by = Auth::id();
        }

        return $this->saveQuietly();
    }

    /**
     * Restore logically deleted record.
     */
    public function restore(): bool
    {
        $this->is_delete = false;
        $this->deleted_at = null;
        if (in_array('deleted_by', $this->getFillable()) || isset($this->deleted_by)) {
            $this->deleted_by = null;
        }

        return $this->saveQuietly();
    }

    /**
     * Check if record is logically deleted.
     */
    public function isDeleted(): bool
    {
        return (bool) $this->is_delete;
    }
}
