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
        if (! Schema::hasTable('project_documents')) {
            Schema::create('project_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
                $table->string('document_name');
                $table->string('type')->nullable(); // category: Contract & Agreement, etc.
                $table->text('file_path');
                $table->unsignedBigInteger('upload_user_id')->nullable();
                $table->foreign('upload_user_id')->references('id')->on('users')->nullOnDelete();
                $table->unsignedBigInteger('file_size')->nullable()->default(0);
                $table->string('mime_type')->nullable();

                // Logical deletion & audit
                $table->boolean('is_delete')->default(false)->index();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('deleted_by')->nullable();
                $table->timestamp('deleted_at')->nullable();
                $table->timestamps();

                $table->index(['project_id', 'is_delete']);
            });
        }

        // Support singular project_document view for compatibility
        try {
            if (DB::getDriverName() === 'sqlite') {
                DB::statement('CREATE VIEW IF NOT EXISTS project_document AS SELECT * FROM project_documents');
            } else {
                DB::statement('CREATE OR REPLACE VIEW project_document AS SELECT * FROM project_documents');
            }
        } catch (Throwable $e) {
            // View creation fallback if permission/driver restriction occurs
        }

        // Backfill from existing polymorphic attachments table
        if (Schema::hasTable('attachments')) {
            $existing = DB::table('attachments')
                ->where('attachable_type', 'like', '%Project')
                ->get();

            foreach ($existing as $att) {
                DB::table('project_documents')->insertOrIgnore([
                    'id' => $att->id,
                    'project_id' => $att->attachable_id,
                    'document_name' => $att->file_name ?? 'Document',
                    'type' => 'Contract & Agreement',
                    'file_path' => $att->file_path ?? '',
                    'upload_user_id' => $att->uploaded_by,
                    'file_size' => $att->file_size ?? 0,
                    'mime_type' => $att->mime_type ?? 'application/octet-stream',
                    'is_delete' => (bool) $att->is_delete,
                    'deleted_at' => $att->deleted_at,
                    'deleted_by' => $att->deleted_by,
                    'created_at' => $att->created_at ?? now(),
                    'updated_at' => $att->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement('DROP VIEW IF EXISTS project_document');
        } catch (Throwable $e) {
            // Ignore if view does not exist
        }

        Schema::dropIfExists('project_documents');
    }
};
