<!DOCTYPE html>
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
                <span class="val" style="color: #b91c1c;">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('M d, Y') : 'No due date' }}</span>
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
