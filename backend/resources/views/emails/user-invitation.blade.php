<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $isNewUser ? 'Welcome to OOLA CRM' : 'Password Reset' }}</title>
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
        .footnote {
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 28px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OOLA CRM</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>

            @if($isNewUser)
                <p>Your user account has been created on <strong>OOLA CRM</strong>. To activate your account and start using the platform, please set up your account password below:</p>
            @else
                <p>You recently requested a password reset for your <strong>OOLA CRM</strong> account (<strong>{{ $user->email }}</strong>). Please click the button below to set a new password:</p>
            @endif

            <div class="btn-wrapper">
                <a href="{{ $resetUrl }}" class="btn" target="_blank">
                    {{ $isNewUser ? 'Set Up Your Password' : 'Reset Password' }}
                </a>
            </div>

            <p>This password link will expire in 24 hours. If you did not request this account or password reset, you can safely ignore this email.</p>

            <div class="footnote">
                <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                <p><a href="{{ $resetUrl }}" style="color: #0284c7;">{{ $resetUrl }}</a></p>
            </div>
        </div>
    </div>
</body>
</html>
