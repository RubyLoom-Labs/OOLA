<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $service) {}

    public function sales(): JsonResponse
    {
        return response()->json($this->service->getSalesReports());
    }

    public function projects(): JsonResponse
    {
        return response()->json($this->service->getProjectReports());
    }

    public function financials(): JsonResponse
    {
        return response()->json($this->service->getFinancialReports());
    }
}
