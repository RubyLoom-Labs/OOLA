<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use App\Traits\HasIsDelete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasAuditFields, HasFactory, HasIsDelete, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar',
        'role_id',
        'status',
        'email_verified_at',
        'is_employee',
        'employee_id',
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
        'deleted_at',
        'deleted_by',
    ];

    protected static function booted(): void
    {
        static::creating(function ($user) {
            if (empty($user->role_id)) {
                $defaultRole = Role::where('slug', 'employee')->first() ?? Role::first();
                if ($defaultRole) {
                    $user->role_id = $defaultRole->id;
                }
            }
        });
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_employee' => 'boolean',
            'is_delete' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * User role relationship.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Associated employee profile (if user is an employee).
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Check if user has specific role by slug or name.
     */
    public function hasRole(string $roleSlug): bool
    {
        $role = $this->role;
        if (! $role) {
            return false;
        }

        if ($role->slug === 'super-admin' || $role->name === 'Super Admin') {
            return true;
        }

        return $role->slug === $roleSlug || $role->name === $roleSlug;
    }

    /**
     * Check if user has a specific permission slug.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->hasRole('super-admin')) {
            return true;
        }

        return $this->role?->permissions()->where('slug', $permissionSlug)->exists() ?? false;
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
