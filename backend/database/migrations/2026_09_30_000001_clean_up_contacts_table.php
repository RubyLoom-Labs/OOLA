<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('contacts', function (Blueprint $table) {
            if (! Schema::hasColumn('contacts', 'company_id')) {
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('contacts', 'company')) {
                $table->string('company')->nullable()->after('company_id');
            }
            if (! Schema::hasColumn('contacts', 'address')) {
                $table->text('address')->nullable()->after('website');
            }
            if (! Schema::hasColumn('contacts', 'birthday')) {
                $table->date('birthday')->nullable()->after('address');
            }
            if (! Schema::hasColumn('contacts', 'status')) {
                $table->string('status')->default('Active')->after('birthday');
            }
        });

        // Drop old columns if they exist
        $columnsToDrop = [
            'customer_id',
            'company_name',
            'company_type',
            'owner_name',
            'owners',
            'owner_email',
            'owner_phone',
            'owner_residence',
            'owner_birthday',
            'company_address',
            'state',
            'contact_details',
            'is_primary',
            'notes',
        ];

        Schema::table('contacts', function (Blueprint $table) use ($columnsToDrop) {
            $existing = [];
            foreach ($columnsToDrop as $col) {
                if (Schema::hasColumn('contacts', $col)) {
                    $existing[] = $col;
                }
            }
            if (! empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }

    public function down(): void
    {
        // No-op
    }
};
