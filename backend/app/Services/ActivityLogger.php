<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogger
{
    /**
     * Log an activity.
     */
    public static function log(
        string $action,
        ?string $description = null,
        mixed $subject = null,
        ?array $properties = null
    ): ActivityLog {
        $user = Auth::user();

        return ActivityLog::create([
            'action' => $action,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->id : null,
            'causer_id' => $user?->id,
            'causer_name' => $user?->name ?? 'System',
            'properties' => $properties,
        ]);
    }
}
