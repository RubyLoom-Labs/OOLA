<!DOCTYPE html>
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
                <span class="val">{{ \Carbon\Carbon::parse($project->start_date)->format('M d, Y') }}</span>
            </div>
            @endif
            @if($project->expected_end_date)
            <div class="row">
                <span class="label">Target Completion:</span>
                <span class="val">{{ \Carbon\Carbon::parse($project->expected_end_date)->format('M d, Y') }}</span>
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
