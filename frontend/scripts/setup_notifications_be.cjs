const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '../../backend');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(backendDir, relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Wrote:', relPath);
}

// -------------------------------------------------------------
// 1. Mailables
// -------------------------------------------------------------
writeFile('app/Mail/ProjectAssignmentMail.php', `<?php

namespace App\\Mail;

use App\\Models\\Project;
use App\\Models\\User;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Mail\\Mailable;
use Illuminate\\Mail\\Mailables\\Content;
use Illuminate\\Mail\\Mailables\\Envelope;
use Illuminate\\Queue\\SerializesModels;

class ProjectAssignmentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Project $project,
        public string $assignedRole = 'Team Member'
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->project->project_code ? "[{$this->project->project_code}] " : '';
        return new Envelope(
            subject: "{$code}You have been assigned to project: {$this->project->project_title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.project-assigned',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
`);

writeFile('app/Mail/TaskAssignmentMail.php', `<?php

namespace App\\Mail;

use App\\Models\\Project;
use App\\Models\\Task;
use App\\Models\\User;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Mail\\Mailable;
use Illuminate\\Mail\\Mailables\\Content;
use Illuminate\\Mail\\Mailables\\Envelope;
use Illuminate\\Queue\\SerializesModels;

class TaskAssignmentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Task $task,
        public ?Project $project = null
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->task->task_code ? "[{$this->task->task_code}] " : '';
        return new Envelope(
            subject: "{$code}New Task Assigned: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.task-assigned',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
`);

writeFile('app/Mail/TaskDueReminderMail.php', `<?php

namespace App\\Mail;

use App\\Models\\Project;
use App\\Models\\Task;
use App\\Models\\User;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Mail\\Mailable;
use Illuminate\\Mail\\Mailables\\Content;
use Illuminate\\Mail\\Mailables\\Envelope;
use Illuminate\\Queue\\SerializesModels;

class TaskDueReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Task $task,
        public string $reminderLabel = 'Soon',
        public ?Project $project = null
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->task->task_code ? "[{$this->task->task_code}] " : '';
        return new Envelope(
            subject: "⏰ {$code}Task Due Reminder: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.task-due-reminder',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
`);

// -------------------------------------------------------------
// 2. Email Blade Templates
// -------------------------------------------------------------
writeFile('resources/views/emails/project-assigned.blade.php', `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Project Assignment - OOLA CRM</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 36px 16px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 32px 28px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0284c7; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 12px 0 6px; }
        .desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 500; }
        .val { color: #0f172a; font-weight: 600; text-align: right; }
        .btn-wrapper { text-align: center; margin: 28px 0 10px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 30px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 26px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge">Project Assignment</span>
            <span style="font-size: 12px; color: #64748b; font-family: monospace;">{{ $project->project_code }}</span>
        </div>
        <div class="title">{{ $project->project_title }}</div>
        <p class="desc">Hello <strong>{{ $user->name }}</strong>, you have been assigned to this project as <strong>{{ $assignedRole }}</strong>.</p>
        
        <div class="card">
            @if($project->customer)
            <div class="row">
                <span class="label">Client Organization:</span>
                <span class="val">{{ $project->customer->company_name ?? 'Client' }}</span>
            </div>
            @endif
            @if($project->manager)
            <div class="row">
                <span class="label">Project Manager:</span>
                <span class="val">{{ $project->manager->name }}</span>
            </div>
            @endif
            <div class="row">
                <span class="label">Priority:</span>
                <span class="val">{{ $project->priority ?? 'Medium' }}</span>
            </div>
            <div class="row">
                <span class="label">Status:</span>
                <span class="val">{{ $project->status ?? 'In Progress' }}</span>
            </div>
            @if($project->start_date)
            <div class="row">
                <span class="label">Start Date:</span>
                <span class="val">{{ \\Carbon\\Carbon::parse($project->start_date)->format('M d, Y') }}</span>
            </div>
            @endif
            @if($project->expected_end_date)
            <div class="row">
                <span class="label">Target Completion:</span>
                <span class="val">{{ \\Carbon\\Carbon::parse($project->expected_end_date)->format('M d, Y') }}</span>
            </div>
            @endif
        </div>

        <div class="btn-wrapper">
            <a href="{{ config('app.url', 'http://localhost:5173') }}/projects/{{ $project->id }}" class="btn" target="_blank">
                View Project Workspace
            </a>
        </div>

        <div class="footer">
            OOLA CRM &bull; Real-time Project Management Notification
        </div>
    </div>
</body>
</html>
`);

writeFile('resources/views/emails/task-assigned.blade.php', `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Task Assigned - OOLA CRM</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 36px 16px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 32px 28px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #fef3c7; color: #d97706; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 12px 0 6px; }
        .desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 500; }
        .val { color: #0f172a; font-weight: 600; text-align: right; }
        .btn-wrapper { text-align: center; margin: 28px 0 10px; }
        .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 30px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(2,132,199,0.2); }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 26px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge">Task Assignment</span>
            <span style="font-size: 12px; color: #64748b; font-family: monospace;">{{ $task->task_code }}</span>
        </div>
        <div class="title">{{ $task->title }}</div>
        <p class="desc">Hello <strong>{{ $user->name }}</strong>, you have been assigned to this task.</p>
        
        @if($task->description)
        <div style="font-size: 13px; color: #334155; background: #ffffff; border-left: 3px solid #0284c7; padding: 10px 14px; border-radius: 4px; margin-bottom: 18px;">
            {{ $task->description }}
        </div>
        @endif

        <div class="card">
            @if($project)
            <div class="row">
                <span class="label">Project:</span>
                <span class="val">{{ $project->project_title }} ({{ $project->project_code }})</span>
            </div>
            @endif
            <div class="row">
                <span class="label">Priority:</span>
                <span class="val">{{ $task->priority ?? 'Medium' }}</span>
            </div>
            <div class="row">
                <span class="label">Task Type:</span>
                <span class="val">{{ $task->task_type ?? 'General' }}</span>
            </div>
            <div class="row">
                <span class="label">Due Date:</span>
                <span class="val" style="color: #b91c1c;">{{ $task->due_date ? \\Carbon\\Carbon::parse($task->due_date)->format('M d, Y') : 'No due date' }}</span>
            </div>
        </div>

        <div class="btn-wrapper">
            <a href="{{ config('app.url', 'http://localhost:5173') }}{{ $project ? '/projects/' . $project->id . '?tab=tasks' : '/tasks' }}" class="btn" target="_blank">
                Open Task in Workspace
            </a>
        </div>

        <div class="footer">
            OOLA CRM &bull; Real-time Task Management Notification
        </div>
    </div>
</body>
</html>
`);

writeFile('resources/views/emails/task-due-reminder.blade.php', `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Task Due Reminder - OOLA CRM</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 36px 16px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #fee2e2; padding: 32px 28px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05); }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #fee2e2; color: #dc2626; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 12px 0 6px; }
        .desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px; }
        .card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 18px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #fca5a5; }
        .row:last-child { border-bottom: none; }
        .label { color: #7f1d1d; font-weight: 500; }
        .val { color: #991b1b; font-weight: 700; text-align: right; }
        .btn-wrapper { text-align: center; margin: 28px 0 10px; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 30px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(220,38,38,0.25); }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 26px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge">⏰ Due Date Reminder</span>
            <span style="font-size: 12px; color: #991b1b; font-family: monospace;">{{ $task->task_code }}</span>
        </div>
        <div class="title">{{ $task->title }}</div>
        <p class="desc">Hello <strong>{{ $user->name }}</strong>, this is an automated reminder that your assigned task is due <strong>{{ $reminderLabel }}</strong>.</p>
        
        <div class="card">
            <div class="row">
                <span class="label">Due Date:</span>
                <span class="val">{{ $task->due_date ? \\Carbon\\Carbon::parse($task->due_date)->format('M d, Y h:i A') : 'Today' }}</span>
            </div>
            <div class="row">
                <span class="label">Priority:</span>
                <span class="val">{{ $task->priority ?? 'High' }}</span>
            </div>
            @if($project)
            <div class="row">
                <span class="label">Project:</span>
                <span class="val">{{ $project->project_title }}</span>
            </div>
            @endif
        </div>

        <div class="btn-wrapper">
            <a href="{{ config('app.url', 'http://localhost:5173') }}{{ $project ? '/projects/' . $project->id . '?tab=tasks' : '/tasks' }}" class="btn" target="_blank">
                View & Complete Task
            </a>
        </div>

        <div class="footer">
            OOLA CRM &bull; Automated Task Due Reminder
        </div>
    </div>
</body>
</html>
`);

// -------------------------------------------------------------
// 3. NotificationService
// -------------------------------------------------------------
writeFile('app/Services/NotificationService.php', `<?php

namespace App\\Services;

use App\\Models\\CrmNotification;
use App\\Models\\User;
use Illuminate\\Mail\\Mailable;
use Illuminate\\Support\\Facades\\Log;
use Illuminate\\Support\\Facades\\Mail;

class NotificationService
{
    /**
     * Send in-app notification and optional email to a user.
     */
    public static function send(
        int|User $user,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null,
        ?Mailable $mailable = null
    ): CrmNotification {
        $userModel = $user instanceof User ? $user : User::find($user);
        $userId = $userModel?->id ?? ($user instanceof User ? $user->id : $user);

        $notification = CrmNotification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'action_url' => $actionUrl,
            'is_read' => false,
        ]);

        // Send email if mailable and user email exist
        if ($mailable && $userModel && !empty($userModel->email)) {
            try {
                Mail::to($userModel->email)->send($mailable);
                Log::info("Notification email dispatched to {$userModel->email} for '{$title}'");
            } catch (\\Throwable $e) {
                Log::warning("Failed to send notification email to {$userModel->email}: " . $e->getMessage());
            }
        }

        return $notification;
    }

    /**
     * Send in-app notification to multiple users.
     */
    public static function sendMany(
        array $userIds,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null,
        ?\\Closure $mailableFactory = null
    ): void {
        foreach ($userIds as $id) {
            $user = User::find($id);
            if ($user) {
                $mailable = $mailableFactory ? $mailableFactory($user) : null;
                self::send($user, $title, $message, $type, $actionUrl, $mailable);
            }
        }
    }
}
`);

// -------------------------------------------------------------
// 4. ReminderService
// -------------------------------------------------------------
writeFile('app/Services/ReminderService.php', `<?php

namespace App\\Services;

use App\\Mail\\TaskDueReminderMail;
use App\\Models\\Project;
use App\\Models\\Reminder;
use App\\Models\\Task;
use App\\Models\\User;
use Carbon\\Carbon;
use Illuminate\\Support\\Facades\\Log;

class ReminderService
{
    /**
     * Check and process pending reminders due at or before now.
     */
    public static function processDueReminders(?int $userId = null): int
    {
        $query = Reminder::where('status', 'pending')
            ->where('notification_sent', false)
            ->where('remind_at', '<=', Carbon::now())
            ->where('is_delete', false)
            ->with(['user', 'remindable']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $dueReminders = $query->get();
        $processedCount = 0;

        foreach ($dueReminders as $reminder) {
            try {
                $user = $reminder->user;
                if (!$user) {
                    $reminder->update(['status' => 'cancelled']);
                    continue;
                }

                $remindable = $reminder->remindable;
                if ($remindable instanceof Task) {
                    $project = null;
                    if ($remindable->taskable_type === Project::class || $remindable->taskable_type === 'App\\\\Models\\\\Project' || $remindable->taskable_type === 'project') {
                        $project = Project::find($remindable->taskable_id);
                    }

                    $reminderLabel = match($reminder->reminder_type) {
                        '30min_before' => 'in 30 minutes',
                        '1h_before' => 'in 1 hour',
                        '1day_before' => 'tomorrow',
                        default => 'soon',
                    };

                    $dueText = $remindable->due_date ? Carbon::parse($remindable->due_date)->format('M d, Y') : 'soon';
                    $actionUrl = $project ? "/projects/{$project->id}?tab=tasks" : "/tasks";

                    NotificationService::send(
                        user: $user,
                        title: '⏰ Task Due Reminder',
                        message: "Task '{$remindable->title}' is due {$reminderLabel} ({$dueText})",
                        type: 'warning',
                        actionUrl: $actionUrl,
                        mailable: new TaskDueReminderMail($user, $remindable, $reminderLabel, $project)
                    );
                }

                $reminder->update([
                    'status' => 'sent',
                    'notification_sent' => true,
                    'email_sent' => true,
                ]);

                $processedCount++;
            } catch (\\Throwable $e) {
                Log::error("Failed to process reminder #{$reminder->id}: " . $e->getMessage());
            }
        }

        return $processedCount;
    }
}
`);

// -------------------------------------------------------------
// 5. SendDueRemindersCommand
// -------------------------------------------------------------
writeFile('app/Console/Commands/SendDueRemindersCommand.php', `<?php

namespace App\\Console\\Commands;

use App\\Services\\ReminderService;
use Illuminate\\Console\\Command;

class SendDueRemindersCommand extends Command
{
    protected $signature = 'crm:send-reminders';
    protected $description = 'Process due reminders, send in-app notifications and trigger reminder emails';

    public function handle(): int
    {
        $count = ReminderService::processDueReminders();
        $this->info("Processed {$count} due reminder(s).");
        return Command::SUCCESS;
    }
}
`);

// -------------------------------------------------------------
// 6. Update ProjectService
// -------------------------------------------------------------
writeFile('app/Services/ProjectService.php', `<?php

namespace App\\Services;

use App\\Mail\\ProjectAssignmentMail;
use App\\Models\\Project;
use App\\Models\\ProjectStage;
use App\\Models\\User;
use Illuminate\\Contracts\\Pagination\\LengthAwarePaginator;
use Illuminate\\Database\\Eloquent\\Collection;

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
`);

// -------------------------------------------------------------
// 7. StoreTaskRequest & UpdateTaskRequest
// -------------------------------------------------------------
writeFile('app/Http/Requests/Task/StoreTaskRequest.php', `<?php

namespace App\\Http\\Requests\\Task;

use Illuminate\\Foundation\\Http\\FormRequest;

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
            'task_type' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'task_stage_id' => ['nullable', 'exists:task_stages,id'],
            'stage' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:Pending,In Progress,In Review,Completed,Overdue'],
            'taskable_type' => ['nullable', 'string'],
            'taskable_id' => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'reminder' => ['nullable', 'string'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ];
    }
}
`);

writeFile('app/Http/Requests/Task/UpdateTaskRequest.php', `<?php

namespace App\\Http\\Requests\\Task;

use Illuminate\\Foundation\\Http\\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_type' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'in:Low,Medium,High,Urgent'],
            'task_stage_id' => ['nullable', 'exists:task_stages,id'],
            'stage' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:Pending,In Progress,In Review,Completed,Overdue'],
            'taskable_type' => ['nullable', 'string'],
            'taskable_id' => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'reminder' => ['nullable', 'string'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
        ];
    }
}
`);

// -------------------------------------------------------------
// 8. Update TaskService
// -------------------------------------------------------------
writeFile('app/Services/TaskService.php', `<?php

namespace App\\Services;

use App\\Mail\\TaskAssignmentMail;
use App\\Models\\Lead;
use App\\Models\\Project;
use App\\Models\\Reminder;
use App\\Models\\Task;
use App\\Models\\TaskStage;
use App\\Models\\User;
use Carbon\\Carbon;
use Illuminate\\Contracts\\Pagination\\LengthAwarePaginator;
use Illuminate\\Database\\Eloquent\\Collection;
use Illuminate\\Validation\\ValidationException;

class TaskService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Task::with(['taskable', 'stage', 'users', 'subtasks', 'timeEntries'])
            ->withCount(['subtasks']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('task_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['taskable_type']) && ! empty($filters['taskable_id'])) {
            $type = $filters['taskable_type'];
            if ($type === 'project' || $type === 'Project') {
                $type = Project::class;
            } elseif ($type === 'lead' || $type === 'Lead') {
                $type = Lead::class;
            }
            $query->where('taskable_type', $type)
                ->where('taskable_id', $filters['taskable_id']);
        }

        if (! empty($filters['stage_id'])) {
            $query->where('task_stage_id', $filters['stage_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['assigned_user_id'])) {
            $userId = $filters['assigned_user_id'];
            $query->whereHas('users', function ($uq) use ($userId) {
                $uq->where('users.id', $userId);
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function getKanban(?string $taskableType = null, ?int $taskableId = null): Collection
    {
        if ($taskableType === 'project' || $taskableType === 'Project') {
            $taskableType = Project::class;
        } elseif ($taskableType === 'lead' || $taskableType === 'Lead') {
            $taskableType = Lead::class;
        }

        return TaskStage::with(['tasks' => function ($query) use ($taskableType, $taskableId) {
            if ($taskableType && $taskableId) {
                $query->where('taskable_type', $taskableType)
                    ->where('taskable_id', $taskableId);
            }
            $query->with(['taskable', 'users', 'subtasks'])
                ->withCount('subtasks')
                ->latest();
        }])->orderBy('order_column')->get();
    }

    public function createTask(array $data, ?array $userIds = []): Task
    {
        // Normalize taskable_type
        if (! empty($data['taskable_type'])) {
            if ($data['taskable_type'] === 'project' || $data['taskable_type'] === 'Project') {
                $data['taskable_type'] = Project::class;
            } elseif ($data['taskable_type'] === 'lead' || $data['taskable_type'] === 'Lead') {
                $data['taskable_type'] = Lead::class;
            }
        }

        // Map stage slug or string to task_stage_id if not explicitly provided
        if (empty($data['task_stage_id']) && ! empty($data['stage'])) {
            $stageMap = [
                'to-do' => 1,
                'todo' => 1,
                'in-progress' => 2,
                'review' => 3,
                'completed' => 4,
            ];
            $stageKey = strtolower($data['stage']);
            if (isset($stageMap[$stageKey])) {
                $data['task_stage_id'] = $stageMap[$stageKey];
            } else {
                $foundStage = TaskStage::where('slug', $stageKey)->orWhere('name', $data['stage'])->first();
                if ($foundStage) {
                    $data['task_stage_id'] = $foundStage->id;
                }
            }
        }
        unset($data['stage']);

        $reminderOption = $data['reminder'] ?? null;
        unset($data['reminder']);

        // Enforce Lead / Project assignment constraint
        if (! empty($data['taskable_type']) && ! empty($data['taskable_id']) && ! empty($userIds)) {
            $this->validateTaskAssignment($data['taskable_type'], (int) $data['taskable_id'], $userIds);
        }

        if (empty($data['task_code'])) {
            $data['task_code'] = 'TSK-'.strtoupper(substr(uniqid(), -5));
        }

        $task = Task::create($data);

        if (! empty($userIds)) {
            $task->users()->sync($userIds);
            $this->notifyAssignedUsers($task, $userIds);
        }

        // Setup reminder if due date and reminder option specified
        if (! empty($task->due_date) && ! empty($reminderOption) && ! empty($userIds)) {
            $this->scheduleTaskReminders($task, $userIds, $reminderOption);
        }

        ActivityLogger::log('Task Created', "Created task: {$task->title}", $task);

        return $task;
    }

    public function updateTask(Task $task, array $data, ?array $userIds = null): Task
    {
        $reminderOption = $data['reminder'] ?? null;
        unset($data['reminder']);

        if (! empty($data['stage'])) {
            $stageMap = [
                'to-do' => 1,
                'todo' => 1,
                'in-progress' => 2,
                'review' => 3,
                'completed' => 4,
            ];
            $stageKey = strtolower($data['stage']);
            if (isset($stageMap[$stageKey])) {
                $data['task_stage_id'] = $stageMap[$stageKey];
            } else {
                $foundStage = TaskStage::where('slug', $stageKey)->orWhere('name', $data['stage'])->first();
                if ($foundStage) {
                    $data['task_stage_id'] = $foundStage->id;
                }
            }
            unset($data['stage']);
        }

        if ($userIds !== null) {
            if ($task->taskable_type && $task->taskable_id) {
                $this->validateTaskAssignment($task->taskable_type, $task->taskable_id, $userIds);
            }
            $prevIds = $task->users()->pluck('users.id')->toArray();
            $newlyAddedIds = array_diff($userIds, $prevIds);

            $task->users()->sync($userIds);

            if (! empty($newlyAddedIds)) {
                $this->notifyAssignedUsers($task, $newlyAddedIds);
            }

            if (! empty($reminderOption) && ! empty($userIds)) {
                $this->scheduleTaskReminders($task, $userIds, $reminderOption);
            }
        }

        $task->update($data);

        ActivityLogger::log('Task Updated', "Updated task: {$task->title}", $task);

        return $task;
    }

    public function updateStage(Task $task, int $stageId): Task
    {
        $oldStage = $task->stage?->name;
        $task->task_stage_id = $stageId;

        $newStage = TaskStage::find($stageId);
        if ($newStage?->is_completed) {
            $task->status = 'Completed';
        }

        $task->save();

        ActivityLogger::log('Task Stage Changed', "Task '{$task->title}' moved to {$newStage?->name}", $task);

        return $task;
    }

    /**
     * Dispatch in-app notification and email to assigned users.
     */
    protected function notifyAssignedUsers(Task $task, array $userIds): void
    {
        $project = null;
        if ($task->taskable_type === Project::class || $task->taskable_type === 'App\\\\Models\\\\Project' || $task->taskable_type === 'project') {
            $project = Project::find($task->taskable_id);
        }

        $users = User::whereIn('id', $userIds)->get();
        $actionUrl = $project ? "/projects/{$project->id}?tab=tasks" : "/tasks";

        foreach ($users as $user) {
            NotificationService::send(
                user: $user,
                title: 'New Task Assigned',
                message: "You have been assigned to task '{$task->title}'" . ($project ? " in project '{$project->project_title}'" : ""),
                type: 'task',
                actionUrl: $actionUrl,
                mailable: new TaskAssignmentMail($user, $task, $project)
            );
        }
    }

    /**
     * Schedule automated reminder entries for assigned users.
     */
    protected function scheduleTaskReminders(Task $task, array $userIds, string $reminderOption): void
    {
        if ($reminderOption === 'None' || empty($task->due_date)) {
            return;
        }

        $minutesBefore = match($reminderOption) {
            '30 Mins Before' => 30,
            '1 Hour Before' => 60,
            '1 Day Before' => 1440,
            default => 60,
        };

        $reminderType = match($reminderOption) {
            '30 Mins Before' => '30min_before',
            '1 Hour Before' => '1h_before',
            '1 Day Before' => '1day_before',
            default => '1h_before',
        };

        $dueDate = Carbon::parse($task->due_date);
        $remindAt = $dueDate->copy()->subMinutes($minutesBefore);

        foreach ($userIds as $userId) {
            Reminder::updateOrCreate(
                [
                    'remindable_type' => Task::class,
                    'remindable_id' => $task->id,
                    'user_id' => $userId,
                ],
                [
                    'reminder_type' => $reminderType,
                    'remind_at' => $remindAt,
                    'status' => 'pending',
                    'notification_sent' => false,
                    'email_sent' => false,
                ]
            );
        }
    }

    /**
     * Validate that assigned users belong to the parent Lead or Project.
     */
    protected function validateTaskAssignment(string $taskableType, int $taskableId, array $userIds): void
    {
        if (str_ends_with($taskableType, 'Lead') || $taskableType === 'lead') {
            $lead = Lead::find($taskableId);
            if ($lead) {
                $allowedIds = $lead->users()->pluck('users.id')->toArray();
                $diff = array_diff($userIds, $allowedIds);
                if (! empty($diff)) {
                    throw ValidationException::withMessages([
                        'users' => ['A task belonging to a Lead may only be assigned to members already added to that Lead.'],
                    ]);
                }
            }
        } elseif (str_ends_with($taskableType, 'Project') || $taskableType === 'project') {
            $project = Project::find($taskableId);
            if ($project) {
                $allowedIds = $project->users()->pluck('users.id')->toArray();
                if ($project->project_manager_id) {
                    $allowedIds[] = $project->project_manager_id;
                }
                $allowedIds = array_unique($allowedIds);
                $diff = array_diff($userIds, $allowedIds);
                if (! empty($diff)) {
                    throw ValidationException::withMessages([
                        'users' => ['A task belonging to a Project may only be assigned to members of that Project.'],
                    ]);
                }
            }
        }
    }
}
`);

// -------------------------------------------------------------
// 9. Update CrmNotificationController
// -------------------------------------------------------------
writeFile('app/Http/Controllers/Api/V1/CrmNotificationController.php', `<?php

namespace App\\Http\\Controllers\\Api\\V1;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Resources\\CrmNotificationResource;
use App\\Models\\CrmNotification;
use App\\Services\\ReminderService;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\AnonymousResourceCollection;
use Laravel\\Sanctum\\PersonalAccessToken;
use Symfony\\Component\\HttpFoundation\\StreamedResponse;

class CrmNotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $userId = $this->resolveUserId($request);
        if ($userId) {
            ReminderService::processDueReminders($userId);
        }

        $notifications = CrmNotification::where('user_id', $userId)
            ->latest()
            ->paginate((int) $request->get('per_page', 20));

        return CrmNotificationResource::collection($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $this->resolveUserId($request);
        if ($userId) {
            ReminderService::processDueReminders($userId);
        }

        $count = CrmNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function markAsRead(Request $request, CrmNotification $crmNotification): JsonResponse
    {
        $userId = $this->resolveUserId($request);
        if ($crmNotification->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $crmNotification->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $this->resolveUserId($request);

        CrmNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * Check and process due reminders immediately.
     */
    public function checkReminders(Request $request): JsonResponse
    {
        $userId = $this->resolveUserId($request);
        $count = ReminderService::processDueReminders($userId);

        return response()->json([
            'message' => "Checked reminders. Processed: {$count}",
            'processed_count' => $count,
        ]);
    }

    /**
     * Server-Sent Events (SSE) real-time streaming endpoint.
     */
    public function stream(Request $request): StreamedResponse
    {
        $user = $request->user();
        if (!$user && $request->has('token')) {
            $token = $request->input('token');
            $pat = PersonalAccessToken::findToken($token);
            if ($pat) {
                $user = $pat->tokenable;
            }
        }

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $userId = $user->id;
        ReminderService::processDueReminders($userId);

        return response()->stream(function () use ($userId) {
            // Disable output buffering
            while (ob_get_level() > 0) {
                ob_end_flush();
            }
            flush();

            // Initial connection event
            $unreadCount = CrmNotification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();
            $recent = CrmNotification::where('user_id', $userId)
                ->latest()
                ->take(15)
                ->get();

            echo "event: init\\n";
            echo "data: " . json_encode([
                'unread_count' => $unreadCount,
                'notifications' => CrmNotificationResource::collection($recent),
            ]) . "\\n\\n";
            flush();

            $lastCheck = now()->subSeconds(2);
            $startTime = time();
            $maxTime = 25; // 25s loop per connection

            while (time() - $startTime < $maxTime) {
                if (connection_aborted()) {
                    break;
                }

                // Periodically check due reminders
                ReminderService::processDueReminders($userId);

                $newItems = CrmNotification::where('user_id', $userId)
                    ->where('created_at', '>', $lastCheck)
                    ->get();

                if ($newItems->isNotEmpty()) {
                    $lastCheck = now();
                    $unread = CrmNotification::where('user_id', $userId)
                        ->where('is_read', false)
                        ->count();

                    foreach ($newItems as $item) {
                        echo "event: notification\\n";
                        echo "data: " . json_encode([
                            'unread_count' => $unread,
                            'notification' => new CrmNotificationResource($item),
                        ]) . "\\n\\n";
                        flush();
                    }
                } else {
                    echo "event: ping\\n";
                    echo "data: [\\"time\\": " . time() . "]\\n\\n";
                    flush();
                }

                sleep(2);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    protected function resolveUserId(Request $request): ?int
    {
        if ($request->user()) {
            return $request->user()->id;
        }

        if ($request->has('token')) {
            $pat = PersonalAccessToken::findToken($request->input('token'));
            if ($pat) {
                return $pat->tokenable_id;
            }
        }

        return null;
    }
}
`);

console.log('Fixed namespaces and wrote all files!');
