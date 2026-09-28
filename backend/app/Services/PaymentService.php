<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaymentService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Payment::with(['customer', 'project', 'quotation']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('payment_code', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhere('receipt_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function createPayment(array $data): Payment
    {
        if (empty($data['payment_code'])) {
            $data['payment_code'] = 'PAY-' . date('Y') . '-' . strtoupper(substr(uniqid(), -4));
        }

        $paymentAmount = (float)($data['payment_amount'] ?? 0);
        $paidAmount = (float)($data['paid_amount'] ?? $paymentAmount);
        $data['outstanding_amount'] = max(0, $paymentAmount - $paidAmount);

        $payment = Payment::create($data);

        // Update Project financial summary if project_id is set
        if ($payment->project_id) {
            $this->updateProjectFinancials($payment->project_id);
        }

        ActivityLogger::log('Payment Created', "Recorded payment: {$payment->payment_code} ({$payment->payment_amount})", $payment);

        return $payment;
    }

    public function updatePayment(Payment $payment, array $data): Payment
    {
        $paymentAmount = (float)($data['payment_amount'] ?? $payment->payment_amount);
        $paidAmount = (float)($data['paid_amount'] ?? $payment->paid_amount);
        $data['outstanding_amount'] = max(0, $paymentAmount - $paidAmount);

        $payment->update($data);

        if ($payment->project_id) {
            $this->updateProjectFinancials($payment->project_id);
        }

        ActivityLogger::log('Payment Updated', "Updated payment: {$payment->payment_code}", $payment);

        return $payment;
    }

    public function getProjectLedger(int $projectId): array
    {
        $project = Project::with(['customer', 'payments'])->findOrFail($projectId);
        $payments = Payment::where('project_id', $projectId)->orderBy('payment_date', 'asc')->get();

        $totalPaid = $payments->sum('paid_amount');
        $quotedAmount = (float)$project->quoted_amount;
        $outstanding = max(0, $quotedAmount - $totalPaid);

        return [
            'project' => $project,
            'quoted_amount' => $quotedAmount,
            'total_paid' => $totalPaid,
            'outstanding' => $outstanding,
            'payments' => $payments,
        ];
    }

    protected function updateProjectFinancials(int $projectId): void
    {
        $project = Project::find($projectId);
        if ($project) {
            $totalRevenue = Payment::where('project_id', $projectId)->sum('paid_amount');
            $project->revenue = $totalRevenue;
            $project->profit = max(0, $totalRevenue - (float)$project->cost);
            $project->saveQuietly();
        }
    }
}
