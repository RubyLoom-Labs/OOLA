<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Project;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $service) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $metrics = $this->service->getMetrics($user);
        $pipeline = $this->service->getSalesPipeline();
        $todayTasks = $this->service->getTodayTasks($user);
        $recentActivities = $this->service->getRecentActivities(10);

        return response()->json([
            'stats' => [
                'active_leads' => Lead::where('status', 'Active')->count(),
                'active_projects' => Project::whereIn('status', ['In Progress', 'Planning'])->count(),
                'total_customers' => Company::count(),
                'pending_payments' => (float) Payment::where('status', 'Pending')->sum('outstanding_amount'),
                'total_revenue' => $metrics['total_revenue'],
                'won_leads' => $metrics['won_leads'],
                'conversion_rate' => $metrics['conversion_rate'],
            ],
            'metrics' => $metrics,
            'pipeline' => $pipeline,
            'sales_pipeline' => $pipeline,
            'today_tasks' => $todayTasks,
            'upcoming_deadlines' => $this->service->getUpcomingDeadlines(),
            'upcoming_events' => $this->service->getUpcomingEvents($user),
            'recent_activities' => $recentActivities,
        ]);
    }

    public function salesPipeline(): JsonResponse
    {
        return response()->json($this->service->getSalesPipeline());
    }

    public function todayTasks(Request $request): JsonResponse
    {
        return response()->json($this->service->getTodayTasks($request->user()));
    }
}
