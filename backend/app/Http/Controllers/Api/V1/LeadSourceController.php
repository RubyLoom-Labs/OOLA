<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LeadSource;
use Illuminate\Http\JsonResponse;

class LeadSourceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(LeadSource::where('is_active', true)->get());
    }
}
