<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create project_contact pivot table
        if (! Schema::hasTable('project_contact')) {
            Schema::create('project_contact', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
                $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['project_id', 'contact_id']);
            });
        }

        // 2. Migrate existing single contact_id relations to project_contact pivot
        if (Schema::hasTable('projects') && Schema::hasColumn('projects', 'contact_id')) {
            $existing = DB::table('projects')->whereNotNull('contact_id')->get(['id', 'contact_id']);
            foreach ($existing as $row) {
                if (! empty($row->contact_id)) {
                    $contactExists = DB::table('contacts')->where('id', $row->contact_id)->exists();
                    if ($contactExists) {
                        DB::table('project_contact')->insertOrIgnore([
                            'project_id' => $row->id,
                            'contact_id' => $row->contact_id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        // 3. Ensure missing columns on projects table and add company_id
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                if (! Schema::hasColumn('projects', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('customer_id');
                }
                if (! Schema::hasColumn('projects', 'actual_end_date')) {
                    $table->date('actual_end_date')->nullable()->after('expected_end_date');
                }
                if (! Schema::hasColumn('projects', 'revenue')) {
                    $table->decimal('revenue', 15, 2)->default(0)->after('cost');
                }
                if (! Schema::hasColumn('projects', 'profit')) {
                    $table->decimal('profit', 15, 2)->default(0)->after('revenue');
                }
            });

            // Backfill company_id from customer_id
            DB::table('projects')->whereNull('company_id')->whereNotNull('customer_id')->update([
                'company_id' => DB::raw('customer_id'),
            ]);

            // 4. Drop contact_id column from projects table
            if (DB::getDriverName() !== 'sqlite' && Schema::hasColumn('projects', 'contact_id')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->dropForeign(['contact_id']);
                    $table->dropColumn('contact_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('projects')) {
            if (! Schema::hasColumn('projects', 'contact_id')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->foreignId('contact_id')->nullable()->after('customer_id')->constrained('contacts')->nullOnDelete();
                });
            }

            if (Schema::hasTable('project_contact')) {
                $pivotRows = DB::table('project_contact')->get();
                foreach ($pivotRows as $pivot) {
                    DB::table('projects')->where('id', $pivot->project_id)->update(['contact_id' => $pivot->contact_id]);
                }
            }
        }

        Schema::dropIfExists('project_contact');
    }
};
