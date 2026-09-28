<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            // Make customer_id nullable so contact can exist independently or with company info
            $table->unsignedBigInteger('customer_id')->nullable()->change();
            
            // First name can be optional if company_name or owner_name is supplied
            $table->string('first_name')->nullable()->change();

            // Extended company and owner properties
            $table->string('company_name')->nullable()->after('customer_id');
            $table->string('company_type')->nullable()->after('company_name'); // Private Ltd, Enterprise, Partnership, Individual, etc.
            $table->string('owner_name')->nullable()->after('company_type');
            $table->json('owners')->nullable()->after('owner_name'); // Support multiple owners: array of strings or objects [{name, email, phone, role, residence}]
            $table->string('owner_email')->nullable()->after('email');
            $table->string('owner_phone')->nullable()->after('phone');
            $table->string('owner_residence')->nullable()->after('owner_phone');
            $table->date('owner_birthday')->nullable()->after('owner_residence');
            $table->text('company_address')->nullable()->after('owner_birthday');
            $table->string('website')->nullable()->after('company_address');
            $table->string('state')->nullable()->after('website');
            $table->json('contact_details')->nullable()->after('state');

            // Indexes for safe & fast lookups
            $table->index('company_name');
            $table->index('owner_name');
            $table->index('owner_email');
            $table->index('state');
            $table->index('company_type');
        });

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

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['company_name']);
            $table->dropIndex(['owner_name']);
            $table->dropIndex(['owner_email']);
            $table->dropIndex(['state']);
            $table->dropIndex(['company_type']);

            $table->dropColumn([
                'company_name',
                'company_type',
                'owner_name',
                'owners',
                'owner_email',
                'owner_phone',
                'owner_residence',
                'owner_birthday',
                'company_address',
                'website',
                'state',
                'contact_details',
            ]);
        });
    }
};
