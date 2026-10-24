<?php

namespace App\Services;

use App\Mail\ProjectAssignmentMail;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Project::with(['customer', 'manager', 'stage', 'users', 'contacts'])
            ->withCount(['tasks', 'payments']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                    ->orWhere('project_code', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('company_name', 'like', "%{$search}%")
                            ->orWhere('company_code', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
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
            $p = $filters['priority'];
            $baseP = str_replace(' Priority', '', $p);
            $query->where(function ($q) use ($p, $baseP) {
                $q->where('priority', $p)
                    ->orWhere('priority', $baseP)
                    ->orWhere('priority', $baseP.' Priority');
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function getKanban(): Collection
    {
        return ProjectStage::with(['projects' => function ($query) {
            $query->with(['customer', 'manager', 'users', 'contacts'])
                ->withCount('tasks')
                ->latest();
        }])->orderBy('order_column')->get();
    }

    public function createProject(array $data, ?array $userIds = [], ?array $contactIds = []): Project
    {
        if (empty($data['project_code'])) {
            $companyId = $data['customer_id'] ?? $data['company_id'] ?? null;
            $data['project_code'] = Project::generateProjectCode($companyId);
        }

        if (empty($data['customer_id']) && ! empty($data['company_id'])) {
            $data['customer_id'] = $data['company_id'];
        }
        if (empty($data['company_id']) && ! empty($data['customer_id'])) {
            $data['company_id'] = $data['customer_id'];
        }

        $userIds = $userIds ?: ($data['user_ids'] ?? []);
        unset($data['user_ids']);

        $contactIds = $contactIds ?: ($data['contact_ids'] ?? []);
        unset($data['contact_ids']);

        $project = Project::create($data);

        if (! empty($userIds)) {
            $project->users()->sync($userIds);
            $this->notifyAssignedUsers($project, $userIds);
        }

        if (! empty($contactIds)) {
            $project->contacts()->sync($contactIds);
        }

        ActivityLogger::log('Project Created', "Created project: {$project->project_title}", $project);

        return $project;
    }

    public function updateProject(Project $project, array $data): Project
    {
        if (array_key_exists('user_ids', $data)) {
            $previousUserIds = $project->users()->pluck('users.id')->toArray();
            $newIds = $data['user_ids'] ?? [];
            $newlyAssignedIds = array_diff($newIds, $previousUserIds);

            $project->users()->sync($newIds);
            unset($data['user_ids']);

            if (! empty($newlyAssignedIds)) {
                $this->notifyAssignedUsers($project, $newlyAssignedIds);
            }
        }

        if (array_key_exists('contact_ids', $data)) {
            $project->contacts()->sync($data['contact_ids'] ?? []);
            unset($data['contact_ids']);
        }

        if (! empty($data['customer_id']) && empty($data['company_id'])) {
            $data['company_id'] = $data['customer_id'];
        } elseif (! empty($data['company_id']) && empty($data['customer_id'])) {
            $data['customer_id'] = $data['company_id'];
        }

        $previousManagerId = $project->project_manager_id;
        $project->update($data);

        if (! empty($data['project_manager_id']) && $data['project_manager_id'] != $previousManagerId) {
            $manager = User::find($data['project_manager_id']);
            if ($manager) {
                NotificationService::send(
                    user: $manager,
                    title: 'Assigned as Project Manager',
                    message: "You have been assigned as the Project Manager for '{$project->project_title}' ({$project->project_code})",
                    type: 'project',
                    actionUrl: "/projects/{$project->id}",
                    mailable: new ProjectAssignmentMail($manager, $project, 'Project Manager')
                );
            }
        }

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

    /**
     * Dispatch in-app notification and email to assigned users.
     */
    protected function notifyAssignedUsers(Project $project, array $userIds): void
    {
        $users = User::whereIn('id', $userIds)->get();
        foreach ($users as $user) {
            NotificationService::send(
                user: $user,
                title: 'Assigned to Project',
                message: "You have been assigned to project '{$project->project_title}' ({$project->project_code})",
                type: 'project',
                actionUrl: "/projects/{$project->id}",
                mailable: new ProjectAssignmentMail($user, $project, 'Team Member')
            );
        }
    }
}
