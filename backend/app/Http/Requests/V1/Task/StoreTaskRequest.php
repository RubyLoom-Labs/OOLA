<?php

namespace App\Http\Requests\V1\Task;

use App\Models\Lead;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_type' => ['nullable', 'string', 'max:50'],
            'priority' => ['nullable', 'in:Low,Medium,High,Urgent'],
            'task_stage_id' => ['nullable', 'exists:task_stages,id'],
            'status' => ['nullable', 'string', 'max:50'],
            'taskable_type' => ['required', 'in:Lead,Project,lead,project,App\\Models\\Lead,App\\Models\\Project'],
            'taskable_id' => ['required', 'integer'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
            'subtasks' => ['nullable', 'array'],
            'subtasks.*.title' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Enforce PRD Rule Section 25: A task belonging to a Lead/Project may only be assigned
     * to users who are already members of that Lead/Project.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $userIds = $this->input('user_ids', []);
            if (empty($userIds)) {
                return;
            }

            $type = strtolower($this->input('taskable_type'));
            $id = $this->input('taskable_id');

            if (str_contains($type, 'lead')) {
                $lead = Lead::find($id);
                if ($lead) {
                    $allowedUserIds = $lead->users()->pluck('users.id')->toArray();
                    foreach ($userIds as $uid) {
                        if (! in_array((int) $uid, $allowedUserIds, true)) {
                            $v->errors()->add('user_ids', "User ID {$uid} must first be added as a member to this Lead before assigning tasks (PRD Rule #25).");
                        }
                    }
                }
            } elseif (str_contains($type, 'project')) {
                $project = Project::find($id);
                if ($project) {
                    $allowedUserIds = $project->users()->pluck('users.id')->toArray();
                    if ($project->project_manager_id) {
                        $allowedUserIds[] = $project->project_manager_id;
                    }
                    foreach ($userIds as $uid) {
                        if (! in_array((int) $uid, $allowedUserIds, true)) {
                            $v->errors()->add('user_ids', "User ID {$uid} must first be added as a member to this Project before assigning tasks (PRD Rule #25).");
                        }
                    }
                }
            }
        });
    }
}
