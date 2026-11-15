<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('comments') && ! Schema::hasColumn('comments', 'display_status')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->boolean('display_status')->default(false)->after('status')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('comments') && Schema::hasColumn('comments', 'display_status')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->dropColumn('display_status');
            });
        }
    }
};

