<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('comments') && ! Schema::hasColumn('comments', 'image')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->string('image')->nullable()->after('comment');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('comments') && Schema::hasColumn('comments', 'image')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->dropColumn('image');
            });
        }
    }
};

