<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalendarEventController;
use App\Http\Controllers\Api\V1\CommunicationLogController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\CompanySizeController;
use App\Http\Controllers\Api\V1\CompanyTypeController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\ContactPhoneNumberController;
use App\Http\Controllers\Api\V1\CrmNotificationController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DesignationController;
use App\Http\Controllers\Api\V1\EmailTemplateController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\HostingDomainController;
use App\Http\Controllers\Api\V1\HostingServerController;
use App\Http\Controllers\Api\V1\HostingServiceController;
use App\Http\Controllers\Api\V1\InquiryController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadSourceController;
use App\Http\Controllers\Api\V1\LeadStageController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProjectAttachmentController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectPriorityController;
use App\Http\Controllers\Api\V1\ProjectStageController;
use App\Http\Controllers\Api\V1\ProjectStatusController;
use App\Http\Controllers\Api\V1\ProjectTaskController;
use App\Http\Controllers\Api\V1\QuotationController;
use App\Http\Controllers\Api\V1\QuotationTemplateController;
use App\Http\Controllers\Api\V1\ReminderController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SubtaskController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TaskTimeEntryController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\WhatsappTemplateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| OOLA CRM API Routes (V1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public Authentication & Password Reset
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password-request', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);

    // Public Website Inquiry Submission & Listing (Open POST for Website, GET for CRM)
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::post('/inquiries', [InquiryController::class, 'store']);
    Route::get('/inquiries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/inquiry', [InquiryController::class, 'index']);
    Route::post('/inquiry', [InquiryController::class, 'store']);
    Route::get('/inquiry/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/inquery', [InquiryController::class, 'index']);
    Route::post('/inquery', [InquiryController::class, 'store']);
    Route::get('/inquery/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/inqueries', [InquiryController::class, 'index']);
    Route::post('/inqueries', [InquiryController::class, 'store']);
    Route::get('/inqueries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inquiries', [InquiryController::class, 'index']);
    Route::post('/website/inquiries', [InquiryController::class, 'store']);
    Route::get('/website/inquiries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inquiry', [InquiryController::class, 'index']);
    Route::post('/website/inquiry', [InquiryController::class, 'store']);
    Route::get('/website/inquiry/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inquery', [InquiryController::class, 'index']);
    Route::post('/website/inquery', [InquiryController::class, 'store']);
    Route::get('/website/inquery/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inqueries', [InquiryController::class, 'index']);
    Route::post('/website/inqueries', [InquiryController::class, 'store']);
    Route::get('/website/inqueries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    // Protected Routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth & Profile
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/sales-pipeline', [DashboardController::class, 'salesPipeline']);
        Route::get('/dashboard/today-tasks', [DashboardController::class, 'todayTasks']);

        // Reports
        Route::get('/reports/sales', [ReportController::class, 'sales']);
        Route::get('/reports/projects', [ReportController::class, 'projects']);
        Route::get('/reports/financials', [ReportController::class, 'financials']);

        // Users & Roles
        Route::get('/users/employees', [UserController::class, 'employees']);
        Route::get('/users/active-employees', [UserController::class, 'employees']);
        Route::get('/employees/users', [UserController::class, 'employees']);
        Route::post('/users/{id}/resend-invite', [UserController::class, 'resendInvite']);
        Route::apiResource('users', UserController::class);
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/permissions', [RoleController::class, 'permissions']);

        // Companies, Company Types & Company Sizes
        Route::get('/company-types', [CompanyTypeController::class, 'index']);
        Route::apiResource('company-types', CompanyTypeController::class);
        Route::get('/company-sizes', [CompanySizeController::class, 'index']);
        Route::apiResource('company-sizes', CompanySizeController::class);
        Route::get('/companies/next-code', [CompanyController::class, 'nextCode']);
        Route::get('/companies/lookup', [CompanyController::class, 'lookup']);
        Route::get('/companies/active-list', [CompanyController::class, 'lookup']);
        Route::post('/companies/{id}/restore', [CompanyController::class, 'restore']);
        Route::get('/companies/{id}/contacts', [CompanyController::class, 'contacts']);
        Route::apiResource('companies', CompanyController::class);

        // Customers compatibility aliases pointing to CompanyController
        Route::get('/customers/next-code', [CompanyController::class, 'nextCode']);
        Route::get('/customers/lookup', [CompanyController::class, 'lookup']);
        Route::get('/customers/active-list', [CompanyController::class, 'lookup']);
        Route::post('/customers/{id}/restore', [CompanyController::class, 'restore']);
        Route::get('/customers/{id}/contacts', [CompanyController::class, 'contacts']);
        Route::apiResource('customers', CompanyController::class);

        // Contacts & Phone Numbers
        Route::post('/contacts/{id}/restore', [ContactController::class, 'restore']);
        Route::get('/contacts/{contact}/projects', [ContactController::class, 'projectsHistory']);
        Route::apiResource('contacts', ContactController::class);
        Route::apiResource('contact-phone-numbers', ContactPhoneNumberController::class);

        // Leads & Pipelines
        Route::get('/leads/kanban', [LeadController::class, 'kanban']);
        Route::match(['post', 'put'], '/leads/{lead}/stage', [LeadController::class, 'updateStage']);
        Route::post('/leads/{lead}/users', [LeadController::class, 'assignUser']);
        Route::delete('/leads/{lead}/users/{userId}', [LeadController::class, 'removeUser']);
        Route::apiResource('leads', LeadController::class);
        Route::apiResource('lead-stages', LeadStageController::class)->only(['index', 'store']);
        Route::get('/lead-sources', [LeadSourceController::class, 'index']);

        // Projects, Stages, Statuses & Priorities
        Route::get('/projects/next-code', [ProjectController::class, 'nextCode']);
        Route::get('/projects/kanban', [ProjectController::class, 'kanban']);
        Route::get('/projects/statuses', [ProjectStatusController::class, 'index']);
        Route::get('/projects/delivery-statuses', [ProjectStatusController::class, 'deliveryStatuses']);
        Route::get('/projects/priorities', [ProjectPriorityController::class, 'index']);
        Route::match(['post', 'put'], '/projects/{project}/stage', [ProjectController::class, 'updateStage']);
        Route::apiResource('projects', ProjectController::class);
        // Project Attachments & Documents
        Route::get('/projects/{project}/attachments', [ProjectAttachmentController::class, 'index']);
        Route::post('/projects/{project}/attachments', [ProjectAttachmentController::class, 'store']);
        Route::get('/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'show']);
        Route::match(['put', 'patch'], '/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'update']);
        Route::delete('/projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'destroy']);
        Route::post('/projects/{project}/attachments/{attachment}/restore', [ProjectAttachmentController::class, 'restore']);

        Route::get('/projects/{project}/documents', [ProjectAttachmentController::class, 'index']);
        Route::post('/projects/{project}/documents', [ProjectAttachmentController::class, 'store']);
        Route::get('/projects/{project}/documents/{attachment}', [ProjectAttachmentController::class, 'show']);
        Route::match(['put', 'patch'], '/projects/{project}/documents/{attachment}', [ProjectAttachmentController::class, 'update']);
        Route::delete('/projects/{project}/documents/{attachment}', [ProjectAttachmentController::class, 'destroy']);
        Route::post('/projects/{project}/documents/{attachment}/restore', [ProjectAttachmentController::class, 'restore']);

        // Project Tasks
        Route::get('/projects/{project}/tasks', [ProjectTaskController::class, 'index']);
        Route::get('/projects/{project}/tasks/kanban', [ProjectTaskController::class, 'kanban']);
        Route::post('/projects/{project}/tasks', [ProjectTaskController::class, 'store']);
        Route::get('/projects/{project}/tasks/{task}', [ProjectTaskController::class, 'show']);
        Route::match(['put', 'patch'], '/projects/{project}/tasks/{task}', [ProjectTaskController::class, 'update']);
        Route::match(['post', 'put'], '/projects/{project}/tasks/{task}/stage', [ProjectTaskController::class, 'updateStage']);
        Route::delete('/projects/{project}/tasks/{task}', [ProjectTaskController::class, 'destroy']);

        // Project Statuses (Active records where is_delete = 0)
        Route::get('/project-statuses/delivery', [ProjectStatusController::class, 'deliveryStatuses']);
        Route::apiResource('project-statuses', ProjectStatusController::class);

        // Project Priorities (Active records where is_delete = 0)
        Route::get('/project-priorities/names', [ProjectPriorityController::class, 'priorityNames']);
        Route::apiResource('project-priorities', ProjectPriorityController::class);

        // Project Stages (Kanban Pipeline)
        Route::get('/project-stages', [ProjectStageController::class, 'index']);

        // Tasks, Subtasks & Timers
        Route::get('/tasks/kanban', [TaskController::class, 'kanban']);
        Route::match(['post', 'put'], '/tasks/{task}/stage', [TaskController::class, 'updateStage']);
        Route::apiResource('tasks', TaskController::class);

        // Subtask Routes (Task-scoped, Project-Task-scoped, and Standalone)
        Route::get('/tasks/{task}/subtasks', [SubtaskController::class, 'index']);
        Route::post('/tasks/{task}/subtasks', [SubtaskController::class, 'store']);
        Route::post('/tasks/{task}/subtasks/reorder', [SubtaskController::class, 'reorder']);
        Route::get('/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'show']);
        Route::match(['put', 'patch'], '/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'update']);
        Route::post('/tasks/{task}/subtasks/{subtask}/toggle', [SubtaskController::class, 'toggle']);
        Route::delete('/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'destroy']);

        Route::get('/projects/{project}/tasks/{task}/subtasks', [SubtaskController::class, 'index']);
        Route::post('/projects/{project}/tasks/{task}/subtasks', [SubtaskController::class, 'store']);
        Route::get('/projects/{project}/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'show']);
        Route::match(['put', 'patch'], '/projects/{project}/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'update']);
        Route::post('/projects/{project}/tasks/{task}/subtasks/{subtask}/toggle', [SubtaskController::class, 'toggle']);
        Route::delete('/projects/{project}/tasks/{task}/subtasks/{subtask}', [SubtaskController::class, 'destroy']);

        Route::get('/subtasks', [SubtaskController::class, 'index']);
        Route::post('/subtasks', [SubtaskController::class, 'store']);
        Route::get('/subtasks/{subtask}', [SubtaskController::class, 'show']);
        Route::match(['put', 'patch'], '/subtasks/{subtask}', [SubtaskController::class, 'update']);
        Route::post('/subtasks/{subtask}/toggle', [SubtaskController::class, 'toggle']);
        Route::delete('/subtasks/{subtask}', [SubtaskController::class, 'destroy']);

        // Timer endpoints
        Route::get('/timers/active', [TaskTimeEntryController::class, 'active']);
        Route::post('/tasks/{task}/timer/start', [TaskTimeEntryController::class, 'start']);
        Route::post('/tasks/{task}/timer/pause', [TaskTimeEntryController::class, 'pause']);
        Route::post('/tasks/{task}/timer/resume', [TaskTimeEntryController::class, 'resume']);
        Route::post('/tasks/{task}/timer/stop', [TaskTimeEntryController::class, 'stop']);

        // Quotations & Templates
        Route::post('/quotations/{quotation}/approve', [QuotationController::class, 'approve']);
        Route::post('/quotations/{quotation}/reject', [QuotationController::class, 'reject']);
        Route::apiResource('quotations', QuotationController::class);
        Route::apiResource('quotation-templates', QuotationTemplateController::class)->only(['index', 'store']);

        // Payments & Expenses
        Route::get('/projects/{projectId}/ledger', [PaymentController::class, 'projectLedger']);
        Route::apiResource('payments', PaymentController::class);
        Route::post('/expenses/{expense}/approve', [ExpenseController::class, 'approve']);
        Route::post('/expenses/{expense}/reject', [ExpenseController::class, 'reject']);
        Route::apiResource('expenses', ExpenseController::class);

        // Hosting & Infrastructure
        Route::apiResource('hosting-domains', HostingDomainController::class);
        Route::apiResource('hosting-servers', HostingServerController::class)->only(['index', 'store']);
        Route::apiResource('hosting-services', HostingServiceController::class)->only(['index', 'store']);

        // Calendar & Reminders
        Route::apiResource('calendar-events', CalendarEventController::class);
        Route::apiResource('reminders', ReminderController::class)->only(['index', 'store']);

        // Employee Management
        Route::get('/employees/{employee}/timesheets', [EmployeeController::class, 'timesheets']);
        Route::apiResource('employees', EmployeeController::class);
        Route::apiResource('departments', DepartmentController::class)->only(['index', 'store']);
        Route::apiResource('designations', DesignationController::class)->only(['index', 'store']);
        Route::post('/leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
        Route::post('/leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject']);
        Route::apiResource('leave-requests', LeaveRequestController::class)->only(['index', 'store']);

        // Communication Hub
        Route::apiResource('email-templates', EmailTemplateController::class)->only(['index', 'store']);
        Route::apiResource('whatsapp-templates', WhatsappTemplateController::class)->only(['index', 'store']);
        Route::apiResource('communication-logs', CommunicationLogController::class)->only(['index', 'store']);

        // Notifications & Activities
        Route::get('/notifications/stream', [CrmNotificationController::class, 'stream']);
        Route::post('/notifications/check-reminders', [CrmNotificationController::class, 'checkReminders']);
        Route::get('/notifications', [CrmNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [CrmNotificationController::class, 'unreadCount']);
        Route::post('/notifications/{crmNotification}/read', [CrmNotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [CrmNotificationController::class, 'markAllAsRead']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    });
});

// Top-level /api/* Inquiry aliases (without /v1 prefix)
Route::get('/inquiries', [InquiryController::class, 'index']);
Route::post('/inquiries', [InquiryController::class, 'store']);
Route::get('/inquiries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

Route::get('/inquiry', [InquiryController::class, 'index']);
Route::post('/inquiry', [InquiryController::class, 'store']);
Route::get('/inquiry/{id}', [InquiryController::class, 'show'])->whereNumber('id');

Route::get('/inquery', [InquiryController::class, 'index']);
Route::post('/inquery', [InquiryController::class, 'store']);
Route::get('/inquery/{id}', [InquiryController::class, 'show'])->whereNumber('id');

Route::get('/inqueries', [InquiryController::class, 'index']);
Route::post('/inqueries', [InquiryController::class, 'store']);
Route::get('/inqueries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

