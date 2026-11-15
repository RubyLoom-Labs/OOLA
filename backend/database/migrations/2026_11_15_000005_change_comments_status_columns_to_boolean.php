<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comments')) {
            return;
        }

        // Snapshot existing rows' approval and display states before dropping varchar columns
        $existingRows = DB::table('comments')
            ->select('id', 'status', 'display_status')
            ->get()
            ->map(function ($row) {
                $rawStatus = strtolower(trim((string) ($row->status ?? '0')));
                $rawDisplay = strtolower(trim((string) ($row->display_status ?? '0')));

                $isApproved = in_array($rawStatus, ['1', 'true', 'approved', 'approve', 'not display', 'not_display'], true);
                $isDisplay = in_array($rawDisplay, ['1', 'true', 'display', 'show'], true);

                return [
                    'id' => $row->id,
                    'status' => $isApproved ? 1 : 0,
                    'display_status' => $isDisplay ? 1 : 0,
                ];
            })
            ->all();

        // Drop old varchar status and display_status columns
        Schema::table('comments', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('comments', 'status')) {
                $columnsToDrop[] = 'status';
            }
            if (Schema::hasColumn('comments', 'display_status')) {
                $columnsToDrop[] = 'display_status';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // Add new boolean (1, 0) status and display_status columns
        Schema::table('comments', function (Blueprint $table) {
            $table->boolean('status')->default(false)->after('image')->index();
            $table->boolean('display_status')->default(false)->after('status')->index();
        });

        // Restore mapped boolean values (1, 0) for any existing rows
        foreach ($existingRows as $item) {
            DB::table('comments')
                ->where('id', $item['id'])
                ->update([
                    'status' => $item['status'],
                    'display_status' => $item['display_status'],
                ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('comments')) {
            return;
        }

        Schema::table('comments', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('comments', 'status')) {
                $columnsToDrop[] = 'status';
            }
            if (Schema::hasColumn('comments', 'display_status')) {
                $columnsToDrop[] = 'display_status';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->string('status')->default('Pending')->after('image')->index();
            $table->string('display_status')->default('Not Display')->after('status')->index();
        });
    }
};

