<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Models\TaskTimeEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmployeeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Employee::with(['user', 'department', 'designation']);
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return EmployeeResource::collection($query->latest()->paginate((int) $request->get('per_page', 15)));
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['employee_code'])) {
            $data['employee_code'] = 'EMP-'.strtoupper(substr(uniqid(), -4));
        }
        $employee = Employee::create($data);

        return (new EmployeeResource($employee->load(['department', 'designation'])))->response()->setStatusCode(201);
    }

    public function show(Employee $employee): EmployeeResource
    {
        return new EmployeeResource($employee->load(['user', 'department', 'designation', 'leaveRequests']));
    }

    public function update(Request $request, Employee $employee): EmployeeResource
    {
        $employee->update($request->all());

        return new EmployeeResource($employee->load(['department', 'designation']));
    }

    public function timesheets(Employee $employee): JsonResponse
    {
        if (! $employee->user_id) {
            return response()->json(['total_seconds' => 0, 'entries' => []]);
        }

        $entries = TaskTimeEntry::with(['task.taskable'])
            ->where('user_id', $employee->user_id)
            ->latest()
            ->limit(50)
            ->get();

        $totalSeconds = $entries->sum('duration_seconds');

        return response()->json([
            'total_hours' => round($totalSeconds / 3600, 2),
            'total_seconds' => $totalSeconds,
            'entries' => $entries,
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->logicalDelete();

        return response()->json(['message' => 'Employee archived successfully.']);
    }
}
