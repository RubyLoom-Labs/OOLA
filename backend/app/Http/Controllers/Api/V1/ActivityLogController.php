<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ActivityLog::query();
        if ($request->has('subject_type') && $request->has('subject_id')) {
            $query->where('subject_type', $request->subject_type)
                  ->where('subject_id', $request->subject_id);
        }
        return ActivityLogResource::collection($query->latest()->paginate((int)$request->get('per_page', 20)));
    }
}
