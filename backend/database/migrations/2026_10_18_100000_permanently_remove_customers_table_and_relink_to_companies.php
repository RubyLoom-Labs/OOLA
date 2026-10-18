<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. Permanently remove customers table
        Schema::dropIfExists('customers');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // No-op: customers table permanently removed
    }
};
