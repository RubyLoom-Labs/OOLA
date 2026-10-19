<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create project_statuses table
        Schema::create('project_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->integer('order_column')->default(0);
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });

        // 2. Create project_priorities table
        Schema::create('project_priorities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->integer('order_column')->default(0);
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });

        // 3. Seed default statuses from UI screenshot:
        // Not Started, In Progress, On Hold, Completed, Cancelled
        $statuses = [
            ['name' => 'Not Started', 'order_column' => 1, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'In Progress', 'order_column' => 2, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'On Hold', 'order_column' => 3, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Completed', 'order_column' => 4, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cancelled', 'order_column' => 5, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('project_statuses')->insert($statuses);

        // 4. Seed default priorities from UI screenshot:
        // Low Priority, Medium Priority, High Priority, Urgent Priority
        $priorities = [
            ['name' => 'Low Priority', 'order_column' => 1, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Medium Priority', 'order_column' => 2, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'High Priority', 'order_column' => 3, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Urgent Priority', 'order_column' => 4, 'is_delete' => false, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('project_priorities')->insert($priorities);
    }

    public function down(): void
    {
        Schema::dropIfExists('project_priorities');
        Schema::dropIfExists('project_statuses');
    }
};
