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
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DesignationController;
use App\Http\Controllers\Api\V1\EmailTemplateController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\HostingDomainController;
use App\Http\Controllers\Api\V1\HostingServerController;
use App\Http\Controllers\Api\V1\HostingServiceController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadSourceController;
use App\Http\Controllers\Api\V1\LeadStageController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectStageController;
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
    // Public Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);

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
        Route::apiResource('companies', CompanyController::class);

        // Customers (legacy compatibility) & Contacts & Phone Numbers
        Route::post('/customers/{id}/restore', [CustomerController::class, 'restore']);
        Route::apiResource('customers', CustomerController::class);
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

        // Projects & Stages
        Route::get('/projects/kanban', [ProjectController::class, 'kanban']);
        Route::match(['post', 'put'], '/projects/{project}/stage', [ProjectController::class, 'updateStage']);
        Route::apiResource('projects', ProjectController::class);
        Route::get('/project-stages', [ProjectStageController::class, 'index']);

        // Tasks, Subtasks & Timers
        Route::get('/tasks/kanban', [TaskController::class, 'kanban']);
        Route::match(['post', 'put'], '/tasks/{task}/stage', [TaskController::class, 'updateStage']);
        Route::apiResource('tasks', TaskController::class);

        Route::post('/subtasks', [SubtaskController::class, 'store']);
        Route::put('/subtasks/{subtask}', [SubtaskController::class, 'update']);
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
        Route::get('/notifications', [CrmNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [CrmNotificationController::class, 'unreadCount']);
        Route::post('/notifications/{crmNotification}/read', [CrmNotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [CrmNotificationController::class, 'markAllAsRead']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    });
});
