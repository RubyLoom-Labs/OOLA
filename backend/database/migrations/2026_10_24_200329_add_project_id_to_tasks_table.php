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
        Schema::table('tasks', function (Blueprint $table) {
            if (! Schema::hasColumn('tasks', 'project_id')) {
                $table->foreignId('project_id')
                    ->nullable()
                    ->after('task_stage_id')
                    ->constrained('projects')
                    ->nullOnDelete();
            }
        });

        // Backfill existing tasks associated with a Project
        DB::table('tasks')
            ->whereNull('project_id')
            ->where(function ($query) {
                $query->where('taskable_type', 'App\\Models\\Project')
                    ->orWhere('taskable_type', 'Project');
            })
            ->update([
                'project_id' => DB::raw('taskable_id'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'project_id')) {
                if (DB::getDriverName() !== 'sqlite') {
                    $table->dropForeign(['project_id']);
                }
                $table->dropColumn('project_id');
            }
        });
    }
};
