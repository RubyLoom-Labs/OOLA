<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_code')->unique();
            $table->string('company_name');
            $table->foreignId('company_type_id')->constrained('company_types')->restrictOnDelete();
            $table->string('email');
            $table->string('industry')->nullable();
            $table->foreignId('company_size_id')->nullable()->constrained('company_sizes')->nullOnDelete();
            $table->boolean('status')->default(true); // 1 = Active, 0 = Inactive
            $table->text('company_description')->nullable();
            $table->string('website')->nullable();
            $table->string('logo')->nullable();
            $table->string('owner_name')->nullable();
            $table->date('owner_birthday')->nullable();
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable()->default('Sri Lanka');

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('company_code');
            $table->index('company_name');
            $table->index('email');
            $table->index('status');
        });

        // Add foreign key or support on contact_phone_numbers if needed
        if (Schema::hasTable('contact_phone_numbers')) {
            Schema::table('contact_phone_numbers', function (Blueprint $table) {
                if (! Schema::hasColumn('contact_phone_numbers', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('id');
                    $table->index(['company_id', 'is_primary']);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('contact_phone_numbers') && Schema::hasColumn('contact_phone_numbers', 'company_id')) {
            Schema::table('contact_phone_numbers', function (Blueprint $table) {
                $table->dropIndex(['company_id', 'is_primary']);
                $table->dropColumn('company_id');
            });
        }

        Schema::dropIfExists('companies');
    }
};
