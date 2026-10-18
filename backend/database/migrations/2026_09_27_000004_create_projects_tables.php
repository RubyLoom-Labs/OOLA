<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color')->default('#4A709C');
            $table->integer('order_column')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_code')->unique()->nullable();
            $table->string('project_title');
            $table->text('description')->nullable();

            $table->unsignedBigInteger('customer_id');
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('stage_id')->nullable()->constrained('project_stages')->nullOnDelete();

            $table->string('project_type')->default('Web Development'); // Web, Mobile, SEO, Maintenance, Cloud, Custom
            $table->string('priority')->default('Medium'); // Low, Medium, High, Urgent
            $table->string('status')->default('In Progress'); // Not Started, In Progress, On Hold, Completed, Cancelled

            $table->date('start_date')->nullable();
            $table->date('expected_end_date')->nullable();
            $table->date('actual_end_date')->nullable();

            // Financial summary
            $table->decimal('budget', 15, 2)->default(0);
            $table->decimal('quoted_amount', 15, 2)->default(0);
            $table->decimal('cost', 15, 2)->default(0);
            $table->decimal('revenue', 15, 2)->default(0);
            $table->decimal('profit', 15, 2)->default(0);

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('stage_id');
            $table->index('status');
            $table->index('expected_end_date');
        });

        Schema::create('project_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('Developer'); // Manager, Developer, Designer, QA, Client
            $table->timestamp('assigned_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_users');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('project_stages');
    }
};
