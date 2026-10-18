<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Changed Successfully</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 36px 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .header h1 {
            color: #0f172a;
            font-size: 24px;
            margin: 0 0 8px;
            font-weight: 700;
        }
        .badge {
            display: inline-block;
            background-color: #dcfce7;
            color: #15803d;
            font-size: 13px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 16px;
        }
        .content {
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .btn {
            display: inline-block;
            background-color: #0284c7;
            color: #ffffff !important;
            font-weight: 600;
            font-size: 15px;
            padding: 12px 28px;
            text-decoration: none;
            border-radius: 8px;
        }
        .security-note {
            background-color: #f1f5f9;
            border-left: 4px solid #0284c7;
            padding: 12px 16px;
            font-size: 13px;
            color: #475569;
            margin-top: 24px;
            border-radius: 0 6px 6px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OOLA CRM</h1>
            <div class="badge">Password Updated</div>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            <p>This is a confirmation that the password for your <strong>OOLA CRM</strong> account (<strong>{{ $user->email }}</strong>) was successfully changed and your account is now active.</p>

            <div class="btn-wrapper">
                <a href="{{ $loginUrl }}" class="btn" target="_blank">
                    Log In to OOLA CRM
                </a>
            </div>

            <div class="security-note">
                <strong>Security Alert:</strong> If you did not make this change, please immediately contact your system administrator to secure your account.
            </div>
        </div>
    </div>
</body>
</html>
