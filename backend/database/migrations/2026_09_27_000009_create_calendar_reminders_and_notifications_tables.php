<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->string('event_type')->default('Meeting'); // Meeting, Call, Follow-up, Deadline, Birthday, Event
            $table->boolean('is_all_day')->default(false);
            $table->string('location')->nullable();
            $table->integer('reminder_before_minutes')->default(30);

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('start_time');
            $table->index('user_id');
        });

        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('remindable');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reminder_type')->default('due_soon'); // 30min_before, 1h_before, custom, due_soon, expiry
            $table->dateTime('remind_at');
            $table->string('status')->default('pending'); // pending, sent, cancelled
            $table->boolean('notification_sent')->default(false);
            $table->boolean('email_sent')->default(false);

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('remind_at');
            $table->index('status');
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->foreignId('causer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('causer_name')->nullable();
            $table->string('action'); // Created, Updated, Stage Changed, Assigned, Deleted, Restored
            $table->text('description')->nullable();
            $table->json('properties')->nullable(); // old & new values
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['subject_type', 'subject_id']);
            $table->index('causer_id');
            $table->index('created_at');
        });

        Schema::create('crm_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('action_url')->nullable();
            $table->string('type')->default('info'); // info, success, warning, danger, task, lead, project, payment
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            // Soft delete
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_notifications');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('reminders');
        Schema::dropIfExists('calendar_events');
    }
};
