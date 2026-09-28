<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use App\Traits\HasIsDelete;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasIsDelete, HasAuditFields;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar',
        'role',
        'designation',
        'department',
        'status',
        'password',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_delete' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * User roles relationship.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')->withPivot('assigned_at');
    }

    /**
     * Check if user has specific role by slug or name.
     */
    public function hasRole(string $roleSlug): bool
    {
        if ($this->role === 'Super Admin' || $this->role === $roleSlug) {
            return true;
        }

        return $this->roles()->where('slug', $roleSlug)->exists();
    }

    /**
     * Check if user has a specific permission slug.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->role === 'Super Admin') {
            return true;
        }

        return $this->roles()->whereHas('permissions', function ($query) use ($permissionSlug) {
            $query->where('slug', $permissionSlug);
        })->exists();
    }

    /**
     * Leads user is assigned to.
     */
    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'lead_users')
            ->withPivot(['role', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Projects user is assigned to.
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_users')
            ->withPivot(['role', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Tasks assigned to user.
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_users')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    /**
     * Task time entries for this user.
     */
    public function timeEntries(): HasMany
    {
        return $this->hasMany(TaskTimeEntry::class);
    }

    /**
     * Reminders for this user.
     */
    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    /**
     * In-app notifications for this user.
     */
    public function crmNotifications(): HasMany
    {
        return $this->hasMany(CrmNotification::class)->latest();
    }
}
