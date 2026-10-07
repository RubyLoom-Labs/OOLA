<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Remove phone column from contacts table
        if (Schema::hasColumn('contacts', 'phone')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->dropColumn('phone');
            });
        }

        // 2. Add country_code column to contact_phone_numbers table
        if (Schema::hasTable('contact_phone_numbers')) {
            Schema::table('contact_phone_numbers', function (Blueprint $table) {
                if (! Schema::hasColumn('contact_phone_numbers', 'country_code')) {
                    $table->string('country_code', 20)->nullable()->after('contact_id');
                }
            });
        }

        // 3. Add company_id and customer_id to contact_sites table
        if (Schema::hasTable('contact_sites')) {
            Schema::table('contact_sites', function (Blueprint $table) {
                if (! Schema::hasColumn('contact_sites', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('id');
                }
                if (! Schema::hasColumn('contact_sites', 'customer_id')) {
                    $table->unsignedBigInteger('customer_id')->nullable()->after('company_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('contacts', 'phone')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->string('phone')->nullable();
            });
        }

        if (Schema::hasColumn('contact_phone_numbers', 'country_code')) {
            Schema::table('contact_phone_numbers', function (Blueprint $table) {
                $table->dropColumn('country_code');
            });
        }

        if (Schema::hasTable('contact_sites')) {
            Schema::table('contact_sites', function (Blueprint $table) {
                if (Schema::hasColumn('contact_sites', 'company_id')) {
                    $table->dropColumn('company_id');
                }
                if (Schema::hasColumn('contact_sites', 'customer_id')) {
                    $table->dropColumn('customer_id');
                }
            });
        }
    }
};
