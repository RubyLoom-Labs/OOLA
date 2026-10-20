<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add columns to users if they do not exist
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role_id')) {
                $table->unsignedBigInteger('role_id')->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'is_employee')) {
                $table->boolean('is_employee')->default(false)->after('status');
            }
            if (! Schema::hasColumn('users', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->nullable()->after('is_employee');
            }
        });

        // 2. Backfill role_id from role_user table if it exists
        if (Schema::hasTable('role_user')) {
            $assignments = DB::table('role_user')->get();
            foreach ($assignments as $assignment) {
                DB::table('users')
                    ->where('id', $assignment->user_id)
                    ->update(['role_id' => $assignment->role_id]);
            }
        }

        // Backfill any remaining users without role_id using a fallback role
        if (DB::table('users')->whereNull('role_id')->exists()) {
            $fallbackRoleId = DB::table('roles')->where('slug', 'employee')->value('id')
                ?? DB::table('roles')->value('id');

            if ($fallbackRoleId) {
                DB::table('users')->whereNull('role_id')->update(['role_id' => $fallbackRoleId]);
            }
        }

        // 3. Backfill is_employee and employee_id from employees table if linked
        if (Schema::hasTable('employees')) {
            $employees = DB::table('employees')->whereNotNull('user_id')->get();
            foreach ($employees as $employee) {
                DB::table('users')
                    ->where('id', $employee->user_id)
                    ->update([
                        'is_employee' => true,
                        'employee_id' => $employee->id,
                    ]);
            }
        }

        // 4. Set role_id to not nullable and establish foreign keys
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id')->nullable(false)->change();
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            if (Schema::hasTable('employees')) {
                $table->foreign('employee_id')->references('id')->on('employees')->nullOnDelete();
            }
        });

        // 5. Drop deprecated columns from users
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['phone', 'role', 'designation', 'department'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // 6. Permanently drop role_user table
        Schema::dropIfExists('role_user');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-create role_user pivot table
        if (! Schema::hasTable('role_user')) {
            Schema::create('role_user', function (Blueprint $table) {
                $table->foreignId('role_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamp('assigned_at')->useCurrent();
                $table->primary(['role_id', 'user_id']);
            });
        }

        // 2. Backfill role_user from users.role_id
        if (Schema::hasColumn('users', 'role_id')) {
            $users = DB::table('users')->whereNotNull('role_id')->get();
            foreach ($users as $user) {
                DB::table('role_user')->insertOrIgnore([
                    'role_id' => $user->role_id,
                    'user_id' => $user->id,
                    'assigned_at' => now(),
                ]);
            }
        }

        // 3. Re-add dropped columns and drop role_id, is_employee, employee_id
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('Employee')->after('avatar');
            $table->string('designation')->nullable()->after('role');
            $table->string('department')->nullable()->after('designation');

            $table->dropForeign(['role_id']);
            if (Schema::hasColumn('users', 'employee_id')) {
                $table->dropForeign(['employee_id']);
            }
            $table->dropColumn(['role_id', 'is_employee', 'employee_id']);
        });
    }
};
