<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Project::with(['customer', 'manager', 'stage', 'users'])
            ->withCount(['tasks', 'payments']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                    ->orWhere('project_code', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['stage_id'])) {
            $query->where('stage_id', $filters['stage_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getKanban(): Collection
    {
        return ProjectStage::with(['projects' => function ($query) {
            $query->with(['customer', 'manager', 'users'])
                ->withCount('tasks')
                ->latest();
        }])->orderBy('order_column')->get();
    }

    public function createProject(array $data, ?array $userIds = []): Project
    {
        if (empty($data['project_code'])) {
            $data['project_code'] = 'PRJ-'.date('Y').'-'.strtoupper(substr(uniqid(), -4));
        }

        $project = Project::create($data);

        if (! empty($userIds)) {
            $project->users()->sync($userIds);
        }

        ActivityLogger::log('Project Created', "Created project: {$project->project_title}", $project);

        if (! empty($userIds)) {
            NotificationService::sendMany(
                $userIds,
                'Assigned to Project',
                "You have been assigned to project '{$project->project_title}'",
                'project',
                "/projects/{$project->id}"
            );
        }

        return $project;
    }

    public function updateProject(Project $project, array $data): Project
    {
        $project->update($data);
        ActivityLogger::log('Project Updated', "Updated project: {$project->project_title}", $project);

        return $project;
    }

    public function updateStage(Project $project, int $stageId): Project
    {
        $oldStage = $project->stage?->name;
        $project->stage_id = $stageId;

        $newStage = ProjectStage::find($stageId);
        if ($newStage?->is_completed) {
            $project->status = 'Completed';
            $project->actual_end_date = now();
        }

        $project->save();

        ActivityLogger::log(
            'Project Stage Changed',
            "Stage changed from {$oldStage} to {$newStage?->name}",
            $project
        );

        return $project;
    }
}
