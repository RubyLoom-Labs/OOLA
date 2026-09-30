<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add contact_id reference to projects table for direct project history tracking
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                if (!Schema::hasColumn('projects', 'contact_id')) {
                    $table->foreignId('contact_id')->nullable()->after('customer_id')->constrained('contacts')->nullOnDelete();
                    $table->index('contact_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                if (Schema::hasColumn('projects', 'contact_id')) {
                    $table->dropForeign(['contact_id']);
                    $table->dropColumn('contact_id');
                }
            });
        }
    }
};
