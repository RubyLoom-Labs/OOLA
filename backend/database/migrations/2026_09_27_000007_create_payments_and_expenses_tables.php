<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_code')->unique()->nullable();
            $table->string('invoice_number')->nullable();
            
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();

            $table->decimal('project_amount', 15, 2)->default(0);
            $table->decimal('payment_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('outstanding_amount', 15, 2)->default(0);
            
            $table->string('payment_terms')->nullable();
            $table->date('payment_date')->nullable();
            $table->string('payment_method')->default('Online'); // Cash, Online, Cheque, Bank Transfer
            $table->string('receipt_number')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->string('recurring_interval')->nullable(); // monthly, yearly, quarterly
            $table->string('status')->default('Pending'); // Pending, Paid, Partially Paid, Overdue, Cancelled
            $table->text('notes')->nullable();

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('project_id');
            $table->index('status');
            $table->index('payment_date');
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_code')->unique()->nullable();
            $table->string('title');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('category')->default('General'); // Server, Software, Travel, Office, Hardware, Contractor
            $table->date('expense_date')->nullable();
            
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();

            $table->text('description')->nullable();
            $table->string('receipt_path')->nullable();
            $table->string('approval_status')->default('Pending'); // Pending, Approved, Rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('approval_status');
            $table->index('expense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('payments');
    }
};
