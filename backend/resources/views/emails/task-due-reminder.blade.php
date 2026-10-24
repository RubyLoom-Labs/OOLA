<!DOCTYPE html>
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
                <span class="val">{{ $task->due_date ? \Carbon\Carbon::parse($task->due_date)->format('M d, Y h:i A') : 'Today' }}</span>
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
