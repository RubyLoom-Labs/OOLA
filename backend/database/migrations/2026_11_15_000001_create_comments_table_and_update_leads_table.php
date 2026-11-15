<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comments')) {
            Schema::create('comments', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('company')->nullable();
                $table->string('title')->nullable();
                $table->longText('comment');
                $table->string('image')->nullable();
                $table->string('status')->default('Pending'); // Pending, Approved, Not Display
                $table->boolean('is_delete')->default(false)->index();
                $table->timestamps();

                $table->index('name');
                $table->index('company');
                $table->index('title');
                $table->index('status');
                $table->index('created_at');
            });
        }

        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table) {
                if (! Schema::hasColumn('leads', 'inquiry_id')) {
                    $table->unsignedBigInteger('inquiry_id')->nullable()->after('id');
                }
                if (! Schema::hasColumn('leads', 'first_name')) {
                    $table->string('first_name')->nullable()->after('requirement_details');
                }
                if (! Schema::hasColumn('leads', 'last_name')) {
                    $table->string('last_name')->nullable()->after('first_name');
                }
                if (! Schema::hasColumn('leads', 'email')) {
                    $table->string('email')->nullable()->after('last_name');
                }
                if (! Schema::hasColumn('leads', 'contact_number')) {
                    $table->string('contact_number')->nullable()->after('email');
                }
                if (! Schema::hasColumn('leads', 'subject')) {
                    $table->string('subject')->nullable()->after('contact_number');
                }
                if (! Schema::hasColumn('leads', 'message')) {
                    $table->longText('message')->nullable()->after('subject');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');

        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table) {
                $cols = ['inquiry_id', 'first_name', 'last_name', 'email', 'contact_number', 'subject', 'message'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('leads', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};

