<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('comments');

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('title')->nullable();
            $table->longText('comment');
            $table->string('image')->nullable();
            $table->boolean('status')->default(false)->index(); // 0 = Pending, 1 = Approved
            $table->boolean('display_status')->default(false)->index(); // 0 = Not Display, 1 = Display
            $table->boolean('is_delete')->default(false)->index();
            $table->timestamps();

            $table->index('name');
            $table->index('company');
            $table->index('title');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};

