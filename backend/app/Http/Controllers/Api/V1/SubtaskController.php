<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubtaskResource;
use App\Models\Subtask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => ['required', 'exists:tasks,id'],
            'title' => ['required', 'string', 'max:255'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'stage' => ['nullable', 'string', 'max:100'],
            'due_date' => ['nullable', 'date'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $subtask = Subtask::create($validated);
        return (new SubtaskResource($subtask->load('assignedUser')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Subtask $subtask): SubtaskResource
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'is_completed' => ['nullable', 'boolean'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'stage' => ['nullable', 'string', 'max:100'],
            'due_date' => ['nullable', 'date'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'order_column' => ['nullable', 'integer'],
        ]);

        $subtask->update($validated);
        return new SubtaskResource($subtask->load('assignedUser'));
    }

    public function toggle(Subtask $subtask): SubtaskResource
    {
        $subtask->is_completed = !$subtask->is_completed;
        $subtask->stage = $subtask->is_completed ? 'Completed' : 'To Do';
        $subtask->save();
        return new SubtaskResource($subtask);
    }

    public function destroy(Subtask $subtask): JsonResponse
    {
        $subtask->logicalDelete();
        return response()->json(['message' => 'Subtask deleted successfully.']);
    }
}
