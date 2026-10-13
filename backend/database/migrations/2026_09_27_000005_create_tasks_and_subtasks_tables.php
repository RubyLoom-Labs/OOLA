<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color')->default('#4A709C');
            $table->integer('order_column')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_code')->unique()->nullable();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('task_type')->default('General'); // General, Call, Meeting, Email, Follow-up, Development, Design, Proposal, Documentation
            $table->string('priority')->default('Medium'); // Low, Medium, High, Urgent
            $table->foreignId('task_stage_id')->nullable()->constrained('task_stages')->nullOnDelete();
            $table->string('status')->default('Pending'); // Pending, In Progress, In Review, Completed, Overdue

            // Polymorphic parent: Lead or Project
            $table->nullableMorphs('taskable');

            $table->dateTime('start_date')->nullable();
            $table->dateTime('due_date')->nullable();
            $table->integer('estimated_minutes')->default(0);
            $table->integer('actual_minutes')->default(0);

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('task_stage_id');
            $table->index('priority');
            $table->index('status');
            $table->index('due_date');
        });

        Schema::create('task_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['task_id', 'user_id']);
        });

        Schema::create('subtasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->string('priority')->default('Medium');
            $table->string('stage')->default('To Do');
            $table->dateTime('due_date')->nullable();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('order_column')->default(0);

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('task_id');
            $table->index('is_completed');
        });

        Schema::create('task_time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_running')->default(false);

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'user_id']);
            $table->index('is_running');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_time_entries');
        Schema::dropIfExists('subtasks');
        Schema::dropIfExists('task_users');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('task_stages');
    }
};
