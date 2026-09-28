<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProjectStage;
use Illuminate\Http\JsonResponse;

class ProjectStageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ProjectStage::orderBy('order_column')->get());
    }
}
