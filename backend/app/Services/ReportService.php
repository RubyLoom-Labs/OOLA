<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function getSalesReports(): array
    {
        $totalLeads = Lead::count();
        $wonLeads = Lead::where('status', 'Won')->count();
        $lostLeads = Lead::where('status', 'Lost')->count();
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 2) : 0;

        $leadsBySource = LeadSource::withCount('leads')->get()->map(function ($src) {
            return [
                'source' => $src->name,
                'count' => $src->leads_count,
            ];
        });

        $lostReasons = Lead::whereNotNull('lost_reason')
            ->select('lost_reason', DB::raw('count(*) as count'))
            ->groupBy('lost_reason')
            ->get();

        return [
            'total_leads' => $totalLeads,
            'won_leads' => $wonLeads,
            'lost_leads' => $lostLeads,
            'conversion_rate' => $conversionRate,
            'leads_by_source' => $leadsBySource,
            'lost_reasons' => $lostReasons,
        ];
    }

    public function getProjectReports(): array
    {
        $activeCount = Project::whereIn('status', ['In Progress', 'Planning'])->count();
        $completedCount = Project::where('status', 'Completed')->count();
        $delayedCount = Project::where('status', '!=', 'Completed')
            ->whereDate('expected_end_date', '<', today())
            ->count();

        $totalBudget = (float) Project::sum('budget');
        $totalRevenue = (float) Project::sum('revenue');
        $totalCost = (float) Project::sum('cost');
        $totalProfit = max(0, $totalRevenue - $totalCost);

        return [
            'active_projects' => $activeCount,
            'completed_projects' => $completedCount,
            'delayed_projects' => $delayedCount,
            'total_budget' => $totalBudget,
            'total_revenue' => $totalRevenue,
            'total_cost' => $totalCost,
            'total_profit' => $totalProfit,
        ];
    }

    public function getFinancialReports(): array
    {
        $totalRevenue = (float) Payment::sum('paid_amount');
        $totalExpenses = (float) Expense::where('approval_status', 'Approved')->sum('amount');
        $netProfit = $totalRevenue - $totalExpenses;
        $outstandingPayments = (float) Payment::where('status', '!=', 'Paid')->sum('outstanding_amount');

        return [
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'outstanding_payments' => $outstandingPayments,
        ];
    }
}
