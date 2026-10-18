<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\CalendarEvent;
use App\Models\Company;
use App\Models\Lead;
use App\Models\LeadStage;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class DashboardService
{
    public function getMetrics(?User $user = null): array
    {
        $totalLeads = Lead::count();
        $wonLeads = Lead::where('status', 'Won')->count();
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 1) : 0;

        $totalRevenue = (float) Payment::sum('paid_amount');
        $pendingPayments = (float) Payment::where('status', 'Pending')->sum('outstanding_amount');

        $activeProjects = Project::whereIn('status', ['In Progress', 'Planning'])->count();
        $totalCustomers = Company::count();

        return [
            'total_leads' => $totalLeads,
            'won_leads' => $wonLeads,
            'conversion_rate' => $conversionRate,
            'total_revenue' => $totalRevenue,
            'pending_payments' => $pendingPayments,
            'active_projects' => $activeProjects,
            'total_customers' => $totalCustomers,
        ];
    }

    public function getSalesPipeline(): array
    {
        $stages = LeadStage::withCount('leads')
            ->orderBy('order_column')
            ->get();

        return $stages->map(function ($stage) {
            $leadsValue = Lead::where('lead_stage_id', $stage->id)->sum('budget_quoted');

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'color' => $stage->color,
                'count' => $stage->leads_count,
                'total_value' => (float) $leadsValue,
            ];
        })->toArray();
    }

    public function getTodayTasks(?User $user = null): array
    {
        $query = Task::with(['taskable', 'stage', 'users'])
            ->whereDate('due_date', '<=', today())
            ->where('status', '!=', 'Completed');

        if ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        return $query->orderBy('due_date', 'asc')->limit(10)->get()->toArray();
    }

    public function getRecentActivities(int $limit = 10): array
    {
        return ActivityLog::latest()->limit($limit)->get()->toArray();
    }

    public function getUpcomingDeadlines(): array
    {
        $projects = Project::where('status', '!=', 'Completed')
            ->whereNotNull('expected_end_date')
            ->whereDate('expected_end_date', '>=', today())
            ->orderBy('expected_end_date', 'asc')
            ->limit(5)
            ->get();

        return $projects->toArray();
    }

    public function getUpcomingEvents(?User $user = null): array
    {
        $query = CalendarEvent::with(['customer', 'lead', 'project'])
            ->whereDate('start_time', '>=', today())
            ->orderBy('start_time', 'asc')
            ->limit(5);

        if ($user) {
            $query->where('user_id', $user->id);
        }

        return $query->get()->toArray();
    }
}
