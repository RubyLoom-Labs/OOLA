<?php

namespace App\Models;

use App\Traits\HasIsDelete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory, HasIsDelete;

    public $timestamps = false;

    protected $hidden = [
        'is_delete',
    ];

    protected $fillable = [
        'subject_type',
        'subject_id',
        'causer_id',
        'causer_name',
        'action',
        'description',
        'properties',
        'created_at',
        'is_delete',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
        'is_delete' => 'boolean',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    /**
     * Log a CRM business event.
     */
    public static function log(string $action, string $description, ?Model $subject = null, ?array $properties = null, ?User $causer = null): self
    {
        $causer = $causer ?? auth()->user();

        return self::create([
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->getKey() : null,
            'causer_id' => $causer?->id,
            'causer_name' => $causer?->name ?? 'System',
            'action' => $action,
            'description' => $description,
            'properties' => $properties,
            'created_at' => now(),
            'is_delete' => false,
        ]);
    }
}
