<?php

namespace Tests;

use App\Models\ActivityLog;
use App\Models\CalendarEvent;
use App\Models\CommunicationLog;
use App\Models\Company;
use App\Models\CompanySize;
use App\Models\CompanyType;
use App\Models\Contact;
use App\Models\ContactPhoneNumber;
use App\Models\ContactSite;
use App\Models\CrmNotification;
use App\Models\Department;
use App\Models\Designation;
use App\Models\EmailTemplate;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\HostingDomain;
use App\Models\HostingServer;
use App\Models\HostingService;
use App\Models\Inquiry;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStage;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Project;
use App\Models\ProjectPriority;
use App\Models\ProjectStage;
use App\Models\ProjectStatus;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\QuotationTemplate;
use App\Models\QuotationTemplateVersion;
use App\Models\Reminder;
use App\Models\Role;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\TaskStage;
use App\Models\TaskTimeEntry;
use App\Models\User;
use App\Models\WhatsappTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('testing') || config('database.default') !== 'sqlite') {
            return;
        }

        // 1. Create Roles
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super-admin', 'is_system' => true],
            ['name' => 'Admin', 'slug' => 'admin', 'is_system' => true],
            ['name' => 'Sales Manager', 'slug' => 'sales-manager', 'is_system' => false],
            ['name' => 'Sales Executive', 'slug' => 'sales-executive', 'is_system' => false],
            ['name' => 'Project Manager', 'slug' => 'project-manager', 'is_system' => false],
            ['name' => 'Developer', 'slug' => 'developer', 'is_system' => false],
            ['name' => 'Designer', 'slug' => 'designer', 'is_system' => false],
            ['name' => 'Accountant', 'slug' => 'accountant', 'is_system' => false],
            ['name' => 'HR Manager', 'slug' => 'hr-manager', 'is_system' => false],
            ['name' => 'Employee', 'slug' => 'employee', 'is_system' => false],
        ];

        $createdRoles = [];
        foreach ($roles as $r) {
            $createdRoles[$r['slug']] = Role::firstOrCreate(['slug' => $r['slug']], $r);
        }

        // 2. Create Permissions
        $modules = ['lead', 'customer', 'project', 'task', 'quotation', 'payment', 'hosting', 'employee', 'report', 'setting'];
        $actions = ['view', 'create', 'update', 'delete', 'manage'];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                $slug = "{$module}.{$action}";
                Permission::firstOrCreate(['slug' => $slug], [
                    'name' => ucfirst($action).' '.ucfirst($module),
                    'slug' => $slug,
                    'module' => ucfirst($module),
                    'description' => "Permission to {$action} {$module}",
                ]);
            }
        }

        // 3. Create Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@ooralabz.com'],
            [
                'name' => 'Alex Morgan',
                'email' => 'admin@ooralabz.com',
                'role_id' => $createdRoles['super-admin']->id,
                'status' => 'Active',
                'is_employee' => false,
                'employee_id' => null,
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        $john = User::firstOrCreate(
            ['email' => 'john@ooralabz.com'],
            [
                'name' => 'John Wick',
                'email' => 'john@ooralabz.com',
                'role_id' => $createdRoles['sales-manager']->id,
                'status' => 'Active',
                'is_employee' => false,
                'employee_id' => null,
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        $mary = User::firstOrCreate(
            ['email' => 'mary@ooralabz.com'],
            [
                'name' => 'Mary Jane',
                'email' => 'mary@ooralabz.com',
                'role_id' => $createdRoles['developer']->id,
                'status' => 'Active',
                'is_employee' => true,
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        // 4. Departments & Designations
        $deptEng = Department::firstOrCreate(['name' => 'Engineering'], ['description' => 'Software & Cloud Infrastructure']);
        $deptSales = Department::firstOrCreate(['name' => 'Sales & Marketing'], ['description' => 'Business Growth & Client Relations']);

        $desLead = Designation::firstOrCreate(['title' => 'Tech Lead', 'department_id' => $deptEng->id]);
        Designation::firstOrCreate(['title' => 'Sales Consultant', 'department_id' => $deptSales->id]);

        // Employees
        $empMary = Employee::firstOrCreate(
            ['email' => 'mary@ooralabz.com'],
            [
                'employee_code' => 'EMP-1001',
                'user_id' => $mary->id,
                'department_id' => $deptEng->id,
                'designation_id' => $desLead->id,
                'first_name' => 'Mary',
                'last_name' => 'Jane',
                'phone' => '+94 77 345 6789',
                'joining_date' => '2024-01-15',
                'salary' => 250000.00,
                'skills' => 'React, Laravel, TypeScript, PostgreSQL, AWS',
                'status' => 'Active',
            ]
        );

        $mary->update(['employee_id' => $empMary->id]);

        // 5. Lead Stages & Sources
        $stages = [
            ['name' => 'New', 'slug' => 'new', 'color' => '#64748B', 'order_column' => 1],
            ['name' => 'Contacted', 'slug' => 'contacted', 'color' => '#3B82F6', 'order_column' => 2],
            ['name' => 'Qualified', 'slug' => 'qualified', 'color' => '#6366F1', 'order_column' => 3],
            ['name' => 'Requirement Gathering', 'slug' => 'requirement-gathering', 'color' => '#8B5CF6', 'order_column' => 4],
            ['name' => 'Proposal', 'slug' => 'proposal', 'color' => '#EC4899', 'order_column' => 5],
            ['name' => 'Negotiation', 'slug' => 'negotiation', 'color' => '#F59E0B', 'order_column' => 6],
            ['name' => 'Won', 'slug' => 'won', 'color' => '#10B981', 'order_column' => 7, 'is_won' => true],
            ['name' => 'Lost', 'slug' => 'lost', 'color' => '#EF4444', 'order_column' => 8, 'is_lost' => true],
        ];
        $createdLeadStages = [];
        foreach ($stages as $s) {
            $createdLeadStages[$s['slug']] = LeadStage::firstOrCreate(['slug' => $s['slug']], $s);
        }

        $sources = [
            ['name' => 'Website Inbound', 'slug' => 'website'],
            ['name' => 'Referral', 'slug' => 'referral'],
            ['name' => 'Social Media (LinkedIn)', 'slug' => 'linkedin'],
            ['name' => 'Direct Call', 'slug' => 'direct-call'],
            ['name' => 'Exhibition / Summit', 'slug' => 'exhibition'],
            ['name' => 'Email Campaign', 'slug' => 'email-campaign'],
        ];
        $createdSources = [];
        foreach ($sources as $src) {
            $createdSources[$src['slug']] = LeadSource::firstOrCreate(['slug' => $src['slug']], $src);
        }

        // 6. Project Stages
        $pStages = [
            ['name' => 'Planning', 'slug' => 'planning', 'color' => '#64748B', 'order_column' => 1],
            ['name' => 'In Progress', 'slug' => 'in-progress', 'color' => '#3B82F6', 'order_column' => 2],
            ['name' => 'Testing & QA', 'slug' => 'testing', 'color' => '#F59E0B', 'order_column' => 3],
            ['name' => 'Completed', 'slug' => 'completed', 'color' => '#10B981', 'order_column' => 4, 'is_completed' => true],
        ];
        $createdProjectStages = [];
        foreach ($pStages as $ps) {
            $createdProjectStages[$ps['slug']] = ProjectStage::firstOrCreate(['slug' => $ps['slug']], $ps);
        }

        // 6b. Project Statuses
        $statuses = [
            ['name' => 'Not Started', 'order_column' => 1],
            ['name' => 'In Progress', 'order_column' => 2],
            ['name' => 'On Hold', 'order_column' => 3],
            ['name' => 'Completed', 'order_column' => 4],
            ['name' => 'Cancelled', 'order_column' => 5],
        ];
        foreach ($statuses as $st) {
            ProjectStatus::firstOrCreate(['name' => $st['name']], array_merge($st, ['is_delete' => false]));
        }

        // 6c. Project Priorities
        $priorities = [
            ['name' => 'Low Priority', 'order_column' => 1],
            ['name' => 'Medium Priority', 'order_column' => 2],
            ['name' => 'High Priority', 'order_column' => 3],
            ['name' => 'Urgent Priority', 'order_column' => 4],
        ];
        foreach ($priorities as $pr) {
            ProjectPriority::firstOrCreate(['name' => $pr['name']], array_merge($pr, ['is_delete' => false]));
        }

        // 7. Task Stages
        $tStages = [
            ['name' => 'To Do', 'slug' => 'todo', 'color' => '#64748B', 'order_column' => 1],
            ['name' => 'In Progress', 'slug' => 'in-progress', 'color' => '#3B82F6', 'order_column' => 2],
            ['name' => 'In Review', 'slug' => 'review', 'color' => '#8B5CF6', 'order_column' => 3],
            ['name' => 'Completed', 'slug' => 'completed', 'color' => '#10B981', 'order_column' => 4, 'is_completed' => true],
        ];
        $createdTaskStages = [];
        foreach ($tStages as $ts) {
            $createdTaskStages[$ts['slug']] = TaskStage::firstOrCreate(['slug' => $ts['slug']], $ts);
        }

        // 8. Company Types & Company Sizes
        $companyTypes = ['Prospect', 'Customer', 'Partner', 'Vendor', 'Agency', 'Reseller', 'Other'];
        $createdCompanyTypes = [];
        foreach ($companyTypes as $typeName) {
            $createdCompanyTypes[$typeName] = CompanyType::firstOrCreate(['name' => $typeName], ['status' => true]);
        }

        $companySizes = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'];
        $createdCompanySizes = [];
        foreach ($companySizes as $sizeName) {
            $createdCompanySizes[$sizeName] = CompanySize::firstOrCreate(['name' => $sizeName], ['status' => true]);
        }

        // 9. Sample Company & Contact
        $company = Company::firstOrCreate(
            ['company_name' => 'Apex Global Logistics'],
            [
                'company_code' => 'CO000001',
                'company_type_id' => $createdCompanyTypes['Customer']->id,
                'company_size_id' => $createdCompanySizes['51–200']->id,
                'email' => 'contact@apexlogistics.com',
                'industry' => 'Logistics & Supply Chain',
                'status' => true,
                'company_description' => 'Leading enterprise logistics & freight forwarding provider.',
                'website' => 'https://apexlogistics.com',
                'owner_name' => 'David Vance',
                'owner_birthday' => '1982-05-14',
                'address_line_1' => '45 Colombo Business Tower',
                'address_line_2' => 'Galle Road',
                'city' => 'Colombo',
                'state' => 'Western Province',
                'postal_code' => '00300',
                'country' => 'Sri Lanka',
            ]
        );

        $contact = Contact::firstOrCreate(
            ['company_id' => $company->id, 'email' => 'sarah.c@apexlogistics.com'],
            [
                'company' => $company->company_name,
                'first_name' => 'Sarah',
                'last_name' => 'Connor',
                'designation' => 'Chief Operations Officer',
                'status' => true,
            ]
        );

        ContactSite::firstOrCreate(
            ['contact_id' => $contact->id, 'url' => 'https://apexlogistics.com'],
            ['name' => 'Official Corporate Site', 'status' => true, 'is_delete' => false]
        );

        ContactPhoneNumber::firstOrCreate(
            ['contact_id' => $contact->id, 'phone_number' => '779876543'],
            ['country_code' => '+94', 'type' => 'Mobile', 'is_primary' => true, 'is_whatsapp' => true, 'notes' => 'Personal Executive Mobile']
        );
        ContactPhoneNumber::firstOrCreate(
            ['contact_id' => $contact->id, 'phone_number' => '112345679'],
            ['country_code' => '+94', 'type' => 'Direct', 'is_primary' => false, 'is_whatsapp' => false, 'notes' => 'Office Direct Extension']
        );

        // 10. Sample Lead
        $lead = Lead::firstOrCreate(
            ['lead_title' => 'Enterprise ERP & Portal Redesign'],
            [
                'lead_code' => 'LEAD-2026-001',
                'requirement_name' => 'Full Custom Logistics ERP & Fleet Tracking Web Platform',
                'requirement_details' => 'End-to-end web portal for cargo tracking, multi-currency invoicing, client self-service, and driver mobile API integration.',
                'customer_id' => $company->id,
                'contact_id' => $contact->id,
                'lead_source_id' => $createdSources['referral']->id,
                'lead_stage_id' => $createdLeadStages['proposal']->id,
                'budget_quoted' => 1250000.00,
                'currency' => 'LKR',
                'priority' => 'High',
                'status' => 'Active',
                'next_step' => 'Submit updated quotation with Phase 2 maintenance SLA',
                'expected_closing_date' => now()->addDays(14),
                'created_by' => $admin->id,
            ]
        );

        $lead->users()->syncWithoutDetaching([
            $admin->id => ['role' => 'Manager'],
            $john->id => ['role' => 'Owner'],
            $mary->id => ['role' => 'Developer'],
        ]);

        // 11. Sample Project
        $project = Project::firstOrCreate(
            ['project_title' => 'Apex Logistics Cloud Migration & Portal'],
            [
                'project_code' => 'PROJO0000011',
                'description' => 'Delivery of high-performance client portal with automated bill generation and cargo tracking.',
                'customer_id' => $company->id,
                'lead_id' => $lead->id,
                'project_manager_id' => $admin->id,
                'stage_id' => $createdProjectStages['in-progress']->id,
                'project_type' => 'Web Development',
                'priority' => 'High',
                'status' => 'In Progress',
                'start_date' => now()->subDays(10),
                'expected_end_date' => now()->addDays(45),
                'budget' => 1500000.00,
                'quoted_amount' => 1401250.00,
                'cost' => 600000.00,
                'revenue' => 700000.00,
                'profit' => 100000.00,
            ]
        );

        $project->users()->syncWithoutDetaching([
            $admin->id => ['role' => 'Manager'],
            $mary->id => ['role' => 'Developer'],
        ]);

        // 12. Tasks & Subtasks
        $task1 = Task::firstOrCreate(
            ['title' => 'Prepare final commercial proposal & quote draft'],
            [
                'task_code' => 'TSK-101',
                'description' => 'Assemble quotation items, discount structures, and delivery timeline milestone breakdown.',
                'task_type' => 'Proposal',
                'priority' => 'High',
                'task_stage_id' => $createdTaskStages['in-progress']->id,
                'status' => 'In Progress',
                'taskable_type' => Lead::class,
                'taskable_id' => $lead->id,
                'start_date' => now(),
                'due_date' => now()->addHours(6),
                'estimated_minutes' => 180,
                'actual_minutes' => 60,
                'created_by' => $admin->id,
            ]
        );
        $task1->users()->syncWithoutDetaching([$john->id, $mary->id]);

        Subtask::firstOrCreate(
            ['task_id' => $task1->id, 'title' => 'Collect requirements sheet'],
            ['is_completed' => true, 'order_column' => 1]
        );
        Subtask::firstOrCreate(
            ['task_id' => $task1->id, 'title' => 'Calculate developer hours & hosting infra cost'],
            ['is_completed' => true, 'order_column' => 2]
        );
        Subtask::firstOrCreate(
            ['task_id' => $task1->id, 'title' => 'Generate formal PDF quote in OOLA system'],
            ['is_completed' => false, 'order_column' => 3]
        );

        TaskTimeEntry::firstOrCreate(
            ['task_id' => $task1->id, 'user_id' => $mary->id],
            [
                'started_at' => now()->subHours(1),
                'ended_at' => now(),
                'duration_seconds' => 3600,
                'notes' => 'Calculated database migration architecture & server requirements.',
                'is_running' => false,
            ]
        );

        // 13. Quotation & Items
        $template = QuotationTemplate::firstOrCreate(
            ['slug' => 'ruby-standard-v1'],
            [
                'name' => 'Standard Tech Proposal & Quotation',
                'description' => 'Professional quotation template with brand header, line items, and signature blocks.',
                'layout_json' => ['theme' => 'navy', 'show_logo' => true, 'show_tax' => true],
                'is_active' => true,
            ]
        );

        $templateVersion = QuotationTemplateVersion::firstOrCreate(
            ['template_id' => $template->id, 'version_number' => 1],
            [
                'structure_json' => ['version' => 1, 'sections' => ['header', 'client_info', 'items_table', 'totals', 'terms']],
                'notes' => 'Initial approved version',
            ]
        );

        $quotation = Quotation::firstOrCreate(
            ['quotation_number' => 'QUO-2026-0089'],
            [
                'title' => 'Web App Development & Dedicated Cloud Infrastructure',
                'customer_id' => $company->id,
                'lead_id' => $lead->id,
                'project_id' => $project->id,
                'template_id' => $template->id,
                'template_version_id' => $templateVersion->id,
                'quotation_date' => now(),
                'valid_until' => now()->addDays(30),
                'currency' => 'LKR',
                'subtotal' => 1250000.00,
                'discount_type' => 'percentage',
                'discount_value' => 5.00,
                'discount_amount' => 62500.00,
                'tax_rate' => 18.00,
                'tax_amount' => 213750.00,
                'total_amount' => 1401250.00,
                'status' => 'Submitted',
                'terms_conditions' => "1. 50% advance on signing.\n2. 30% on staging delivery.\n3. 20% on final deployment.\n4. 1 year free bug-fix warranty.",
                'notes' => 'Quotation includes initial cloud setup and SSL installation.',
                'created_by' => $admin->id,
            ]
        );

        QuotationItem::firstOrCreate(
            ['quotation_id' => $quotation->id, 'item_name' => 'Full-Stack Web Portal (React + Laravel)'],
            [
                'description' => 'Custom customer tracking interface, role management, responsive dashboard.',
                'quantity' => 1,
                'unit_price' => 850000.00,
                'discount' => 0,
                'tax_rate' => 18,
                'total' => 850000.00,
                'order_column' => 1,
            ]
        );

        QuotationItem::firstOrCreate(
            ['quotation_id' => $quotation->id, 'item_name' => 'High-Availability VPS & Dedicated Database Server'],
            [
                'description' => '1 Year managed hosting, daily backups, 99.9% uptime SLA.',
                'quantity' => 1,
                'unit_price' => 400000.00,
                'discount' => 0,
                'tax_rate' => 18,
                'total' => 400000.00,
                'order_column' => 2,
            ]
        );

        // 14. Payments & Expenses
        Payment::firstOrCreate(
            ['payment_code' => 'PAY-2026-001'],
            [
                'invoice_number' => 'INV-2026-0045',
                'customer_id' => $company->id,
                'project_id' => $project->id,
                'quotation_id' => $quotation->id,
                'project_amount' => 1401250.00,
                'payment_amount' => 700000.00,
                'paid_amount' => 700000.00,
                'outstanding_amount' => 701250.00,
                'payment_terms' => '50% Initial Advance Payment',
                'payment_date' => now()->subDays(5),
                'payment_method' => 'Online',
                'receipt_number' => 'REC-9982',
                'status' => 'Paid',
            ]
        );

        Expense::firstOrCreate(
            ['expense_code' => 'EXP-2026-001'],
            [
                'title' => 'Cloud Cluster Provisioning (Hetzner Dedicated)',
                'amount' => 45000.00,
                'category' => 'Server',
                'expense_date' => now()->subDays(3),
                'user_id' => $mary->id,
                'project_id' => $project->id,
                'description' => 'Annual dedicated server billing for Apex Logistics test staging environment.',
                'approval_status' => 'Approved',
                'approved_by' => $admin->id,
                'approved_at' => now()->subDays(2),
            ]
        );

        // 15. Hosting & Infrastructure
        $domain = HostingDomain::firstOrCreate(
            ['domain_name' => 'apexlogistics.com'],
            [
                'customer_id' => $company->id,
                'contact_id' => $contact->id,
                'provider' => 'Cloudflare Registry',
                'purchase_date' => now()->subMonths(6),
                'cost_price' => 4500.00,
                'selling_price' => 7500.00,
                'renew_date' => now()->addMonths(6),
                'encrypted_credentials' => 'User: admin@apexlogistics.com',
                'status' => 'Active',
            ]
        );

        HostingServer::firstOrCreate(
            ['server_name' => 'Apex-Production-Hetzner-01'],
            [
                'customer_id' => $company->id,
                'purpose' => 'Production Web & API Cluster',
                'provider' => 'Hetzner Cloud',
                'ip_address' => '159.69.142.88',
                'plan' => 'CPX41 (8 vCPU / 16 GB RAM)',
                'purchase_date' => now()->subMonths(2),
                'cost_price' => 12000.00,
                'selling_price' => 20000.00,
                'renew_date' => now()->addDays(28),
                'domain_id' => $domain->id,
                'status' => 'Active',
            ]
        );

        HostingService::firstOrCreate(
            ['service_type' => 'Google Workspace Business Starter'],
            [
                'customer_id' => $company->id,
                'provider' => 'Google Cloud',
                'cost_price' => 18000.00,
                'selling_price' => 24000.00,
                'renew_date' => now()->addMonths(3),
                'status' => 'Active',
            ]
        );

        // 16. Calendar Events & Reminders
        CalendarEvent::firstOrCreate(
            ['title' => 'Apex Logistics Requirement Alignment & Demo Call'],
            [
                'description' => 'Review milestone 1 database schemas and mobile API integration endpoints.',
                'start_time' => now()->addHours(4),
                'end_time' => now()->addHours(5),
                'event_type' => 'Meeting',
                'location' => 'Google Meet',
                'user_id' => $admin->id,
                'customer_id' => $company->id,
                'lead_id' => $lead->id,
                'project_id' => $project->id,
            ]
        );

        Reminder::firstOrCreate(
            ['user_id' => $admin->id, 'reminder_type' => '30min_before'],
            [
                'remindable_type' => Lead::class,
                'remindable_id' => $lead->id,
                'remind_at' => now()->addHours(3)->addMinutes(30),
                'status' => 'pending',
            ]
        );

        // 17. Communication Templates
        EmailTemplate::firstOrCreate(
            ['slug' => 'quotation-submission'],
            [
                'name' => 'Quotation Submission Notice',
                'subject' => 'Your Quotation {{quotation_number}} for {{project_name}} is Ready',
                'body_html' => '<p>Dear {{customer_name}},</p><p>We are excited to share the proposal and quotation <strong>{{quotation_number}}</strong> for your review.</p><p>Best regards,<br>OOLA Platform Team</p>',
                'variables' => ['customer_name', 'quotation_number', 'project_name', 'amount'],
                'is_active' => true,
            ]
        );

        WhatsappTemplate::firstOrCreate(
            ['slug' => 'payment-received-alert'],
            [
                'name' => 'Payment Receipt WhatsApp Notice',
                'category' => 'Billing',
                'message_body' => 'Hello {{customer_name}}, we have successfully received your payment of {{amount}} for {{project_name}}. Invoice: {{invoice_number}}. Thank you for choosing us!',
                'variables' => ['customer_name', 'amount', 'project_name', 'invoice_number'],
                'status' => 'Approved',
            ]
        );

        CommunicationLog::firstOrCreate(
            ['recipient' => 'contact@apexlogistics.com'],
            [
                'channel' => 'email',
                'subject' => 'Welcome to OOLA CRM Platform',
                'content' => 'Onboarding details and client portal access credentials.',
                'status' => 'sent',
                'sent_at' => now()->subDays(1),
                'external_message_id' => 'MSG-100293',
            ]
        );

        // 18. Notifications & Activity Logs
        CrmNotification::firstOrCreate(
            ['user_id' => $admin->id, 'title' => 'Payment Received for Apex Logistics'],
            [
                'message' => 'LKR 700,000.00 advance payment was confirmed for Project PROJO0000011.',
                'type' => 'payment',
                'action_url' => '/projects/'.$project->id,
                'is_read' => false,
            ]
        );

        ActivityLog::create([
            'action' => 'Project Initialized',
            'description' => 'Project PROJO0000011 moved to In Progress state with commercial quotation QUO-2026-0089.',
            'subject_type' => Project::class,
            'subject_id' => $project->id,
            'causer_id' => $admin->id,
            'causer_name' => $admin->name,
        ]);

        // 19. Sample Website Inquiries
        Inquiry::firstOrCreate(
            ['email' => 'kavan.perera@ceylontech.lk', 'subject' => 'Enterprise ERP & Cloud Modernization Inquiry'],
            [
                'first_name' => 'Kavan',
                'last_name' => 'Perera',
                'contact_number' => '+94 77 458 9210',
                'message' => "Hello Ruby Loom Labs Team,\n\nWe are looking to modernize our legacy ERP and warehouse management system across 4 distribution centers in Sri Lanka.",
                'status' => true,
            ]
        );

        Inquiry::firstOrCreate(
            ['email' => 'amanda.silva@oceanichotels.com', 'subject' => 'Custom Booking Engine & CRM Integration'],
            [
                'first_name' => 'Amanda',
                'last_name' => 'Silva',
                'contact_number' => '+94 11 289 4455',
                'message' => 'We would like a quotation for redesigning our hospitality group website with a direct room booking engine, payment gateway integration, and guest CRM synchronization.',
                'status' => true,
            ]
        );
    }
}

