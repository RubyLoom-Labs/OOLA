<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Expense::with(['user', 'project']);
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        if ($request->has('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        return ExpenseResource::collection($query->latest()->paginate((int) $request->get('per_page', 15)));
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['user_id'])) {
            $data['user_id'] = $request->user()->id;
        }
        $expense = Expense::create($data);

        return (new ExpenseResource($expense->load(['user', 'project'])))->response()->setStatusCode(201);
    }

    public function show(Expense $expense): ExpenseResource
    {
        return new ExpenseResource($expense->load(['user', 'project']));
    }

    public function approve(Request $request, Expense $expense): JsonResponse
    {
        $expense->update([
            'approval_status' => 'Approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json(['message' => 'Expense approved.', 'expense' => new ExpenseResource($expense)]);
    }

    public function reject(Request $request, Expense $expense): JsonResponse
    {
        $expense->update([
            'approval_status' => 'Rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json(['message' => 'Expense rejected.', 'expense' => new ExpenseResource($expense)]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->logicalDelete();

        return response()->json(['message' => 'Expense removed.']);
    }
}
