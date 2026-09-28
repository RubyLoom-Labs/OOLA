<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee', 'approver']);
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        return response()->json($query->latest()->paginate((int)$request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'leave_type' => ['required', 'string', 'in:Annual,Casual,Sick,Maternity,Unpaid'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string'],
        ]);

        $leave = LeaveRequest::create($validated);
        return response()->json($leave, 201);
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $leaveRequest->update([
            'status' => 'Approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);
        return response()->json(['message' => 'Leave approved.', 'leave' => $leaveRequest]);
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $leaveRequest->update([
            'status' => 'Rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);
        return response()->json(['message' => 'Leave rejected.', 'leave' => $leaveRequest]);
    }
}
