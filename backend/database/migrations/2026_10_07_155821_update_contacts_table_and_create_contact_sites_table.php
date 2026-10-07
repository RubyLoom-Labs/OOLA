<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update contacts table: remove website field and convert status to boolean
        if (Schema::hasColumn('contacts', 'website')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->dropColumn('website');
            });
        }

        if (Schema::hasColumn('contacts', 'status')) {
            // Convert string statuses to boolean values ('1' / '0') before changing column type
            DB::table('contacts')
                ->whereIn('status', ['Active', 'active', '1', 'true', 1])
                ->update(['status' => '1']);

            DB::table('contacts')
                ->whereNotIn('status', ['1'])
                ->update(['status' => '0']);

            Schema::table('contacts', function (Blueprint $table) {
                $table->boolean('status')->default(true)->change();
            });
        }

        // 2. Create contact_sites table (one to many relation with contacts)
        if (! Schema::hasTable('contact_sites')) {
            Schema::create('contact_sites', function (Blueprint $table) {
                $table->id();
                $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
                $table->string('name')->nullable();
                $table->string('url')->nullable();
                $table->boolean('is_delete')->default(false)->index();
                $table->boolean('status')->default(true);

                // Soft delete & audit fields
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('deleted_by')->nullable();
                $table->timestamp('deleted_at')->nullable();
                $table->timestamps();

                $table->index('contact_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_sites');

        if (! Schema::hasColumn('contacts', 'website')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->string('website')->nullable();
            });
        }

        if (Schema::hasColumn('contacts', 'status')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->string('status')->default('Active')->change();
            });
        }
    }
};
