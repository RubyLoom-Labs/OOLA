<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('contact_number');
            $table->string('subject')->nullable();
            $table->longText('message')->nullable();
            $table->boolean('status')->default(true);

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('first_name');
            $table->index('last_name');
            $table->index('email');
            $table->index('contact_number');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};

