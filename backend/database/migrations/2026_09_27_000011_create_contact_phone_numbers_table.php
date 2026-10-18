<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_phone_numbers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->cascadeOnDelete();

            $table->string('phone_number');
            $table->string('type')->default('Mobile'); // Mobile, Work, Home, WhatsApp, Direct, Fax, Other
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_whatsapp')->default(false);
            $table->string('notes')->nullable();

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'is_primary']);
            $table->index(['contact_id', 'is_primary']);
            $table->index('phone_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_phone_numbers');
    }
};
