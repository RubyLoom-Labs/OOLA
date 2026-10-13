<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color')->default('#4A709C');
            $table->integer('order_column')->default(0);
            $table->boolean('is_won')->default(false);
            $table->boolean('is_lost')->default(false);
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('lead_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('lead_code')->unique()->nullable();
            $table->string('lead_title');
            $table->string('requirement_name')->nullable();
            $table->longText('requirement_details')->nullable();

            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_source_id')->nullable()->constrained('lead_sources')->nullOnDelete();
            $table->foreignId('lead_stage_id')->nullable()->constrained('lead_stages')->nullOnDelete();

            $table->decimal('budget_quoted', 15, 2)->default(0);
            $table->string('currency', 10)->default('LKR');
            $table->string('priority')->default('Medium'); // Low, Medium, High, Urgent
            $table->string('status')->default('Active'); // Active, Won, Lost, Converted
            $table->string('next_step')->nullable();
            $table->date('expected_closing_date')->nullable();

            // Lost analysis
            $table->string('lost_reason')->nullable();
            $table->text('lost_note')->nullable();
            $table->timestamp('lost_at')->nullable();

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('lead_stage_id');
            $table->index('priority');
            $table->index('status');
            $table->index('expected_closing_date');
        });

        Schema::create('lead_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('Follower'); // Owner, Manager, Developer, Designer, Follower
            $table->timestamp('assigned_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['lead_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_users');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('lead_sources');
        Schema::dropIfExists('lead_stages');
    }
};
