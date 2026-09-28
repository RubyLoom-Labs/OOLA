<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\CalendarEvent;
use App\Models\CommunicationLog;
use App\Models\Contact;
use App\Models\CrmNotification;
use App\Models\Customer;
use App\Models\Department;
use App\Models\Designation;
use App\Models\EmailTemplate;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\HostingDomain;
use App\Models\HostingServer;
use App\Models\HostingService;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStage;
use App\Models\LeaveRequest;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Project;
use App\Models\ProjectStage;
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

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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
                    'name' => ucfirst($action) . ' ' . ucfirst($module),
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
                'phone' => '+94 77 123 4567',
                'role' => 'Super Admin',
                'designation' => 'Principal Architect & Lead',
                'department' => 'Executive',
                'status' => 'Active',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $admin->roles()->syncWithoutDetaching([$createdRoles['super-admin']->id]);

        $john = User::firstOrCreate(
            ['email' => 'john@ooralabz.com'],
            [
                'name' => 'John Wick',
                'email' => 'john@ooralabz.com',
                'phone' => '+94 77 234 5678',
                'role' => 'Sales Manager',
                'designation' => 'Head of Business Development',
                'department' => 'Sales',
                'status' => 'Active',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $john->roles()->syncWithoutDetaching([$createdRoles['sales-manager']->id]);

        $mary = User::firstOrCreate(
            ['email' => 'mary@ooralabz.com'],
            [
                'name' => 'Mary Jane',
                'email' => 'mary@ooralabz.com',
                'phone' => '+94 77 345 6789',
                'role' => 'Developer',
                'designation' => 'Senior Full Stack Engineer',
                'department' => 'Engineering',
                'status' => 'Active',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $mary->roles()->syncWithoutDetaching([$createdRoles['developer']->id]);

        // 4. Departments & Designations
        $deptEng = Department::firstOrCreate(['name' => 'Engineering'], ['description' => 'Software & Cloud Infrastructure']);
        $deptSales = Department::firstOrCreate(['name' => 'Sales & Marketing'], ['description' => 'Business Growth & Client Relations']);

        $desLead = Designation::firstOrCreate(['title' => 'Tech Lead', 'department_id' => $deptEng->id]);
        $desSales = Designation::firstOrCreate(['title' => 'Sales Consultant', 'department_id' => $deptSales->id]);

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

        // 8. Sample Customer & Contact & Phone Numbers
        $customer = Customer::firstOrCreate(
            ['company_name' => 'Apex Global Logistics'],
            [
                'customer_code' => 'CUST-001',
                'company_type' => 'Private Ltd',
                'designation' => 'Logistics & Supply Chain',
                'email' => 'contact@apexlogistics.com',
                'phone' => '+94 11 234 5678',
                'website' => 'https://apexlogistics.com',
                'address' => '45 Colombo Business Tower, Galle Road',
                'city' => 'Colombo',
                'country' => 'Sri Lanka',
                'status' => 'Active',
            ]
        );

        \App\Models\ContactPhoneNumber::firstOrCreate(
            ['customer_id' => $customer->id, 'phone_number' => '+94 11 234 5678'],
            ['type' => 'Work', 'is_primary' => true, 'is_whatsapp' => false, 'notes' => 'Head Office Hotline']
        );
        \App\Models\ContactPhoneNumber::firstOrCreate(
            ['customer_id' => $customer->id, 'phone_number' => '+94 77 111 2233'],
            ['type' => 'WhatsApp', 'is_primary' => false, 'is_whatsapp' => true, 'notes' => 'Official Customer Support WhatsApp']
        );

        $contact = Contact::firstOrCreate(
            ['customer_id' => $customer->id, 'email' => 'sarah.c@apexlogistics.com'],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Connor',
                'designation' => 'Chief Operations Officer',
                'phone' => '+94 77 987 6543',
                'is_primary' => true,
            ]
        );

        \App\Models\ContactPhoneNumber::firstOrCreate(
            ['contact_id' => $contact->id, 'phone_number' => '+94 77 987 6543'],
            ['type' => 'Mobile', 'is_primary' => true, 'is_whatsapp' => true, 'notes' => 'Personal Executive Mobile']
        );
        \App\Models\ContactPhoneNumber::firstOrCreate(
            ['contact_id' => $contact->id, 'phone_number' => '+94 11 234 5679'],
            ['type' => 'Direct', 'is_primary' => false, 'is_whatsapp' => false, 'notes' => 'Office Direct Extension']
        );

        // 9. Sample Lead
        $lead = Lead::firstOrCreate(
            ['lead_title' => 'Enterprise ERP & Portal Redesign'],
            [
                'lead_code' => 'LEAD-2026-001',
                'requirement_name' => 'Full Custom Logistics ERP & Fleet Tracking Web Platform',
                'requirement_details' => 'End-to-end web portal for cargo tracking, multi-currency invoicing, client self-service, and driver mobile API integration.',
                'customer_id' => $customer->id,
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

        // 10. Sample Project
        $project = Project::firstOrCreate(
            ['project_title' => 'Apex Logistics Cloud Migration & Portal'],
            [
                'project_code' => 'PRJ-2026-001',
                'description' => 'Delivery of high-performance client portal with automated bill generation and cargo tracking.',
                'customer_id' => $customer->id,
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

        // 11. Tasks & Subtasks
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

        // 12. Quotation & Items
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
                'customer_id' => $customer->id,
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

        // 13. Payments & Expenses
        Payment::firstOrCreate(
            ['payment_code' => 'PAY-2026-001'],
            [
                'invoice_number' => 'INV-2026-0045',
                'customer_id' => $customer->id,
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

        // 14. Hosting & Infrastructure
        $domain = HostingDomain::firstOrCreate(
            ['domain_name' => 'apexlogistics.com'],
            [
                'customer_id' => $customer->id,
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
                'customer_id' => $customer->id,
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
                'customer_id' => $customer->id,
                'provider' => 'Google Cloud',
                'cost_price' => 18000.00,
                'selling_price' => 24000.00,
                'renew_date' => now()->addMonths(3),
                'status' => 'Active',
            ]
        );

        // 15. Calendar Events & Reminders
        CalendarEvent::firstOrCreate(
            ['title' => 'Apex Logistics Requirement Alignment & Demo Call'],
            [
                'description' => 'Review milestone 1 database schemas and mobile API integration endpoints.',
                'start_time' => now()->addHours(4),
                'end_time' => now()->addHours(5),
                'event_type' => 'Meeting',
                'location' => 'Google Meet',
                'user_id' => $admin->id,
                'customer_id' => $customer->id,
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

        // 16. Communication Templates
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

        // 17. Notifications & Activity Logs
        CrmNotification::firstOrCreate(
            ['user_id' => $admin->id, 'title' => 'Payment Received for Apex Logistics'],
            [
                'message' => 'LKR 700,000.00 advance payment was confirmed for Project PRJ-2026-001.',
                'type' => 'payment',
                'action_url' => '/projects/' . $project->id,
                'is_read' => false,
            ]
        );

        ActivityLog::create([
            'action' => 'Project Initialized',
            'description' => 'Project PRJ-2026-001 moved to In Progress state with commercial quotation QUO-2026-0089.',
            'subject_type' => Project::class,
            'subject_id' => $project->id,
            'causer_id' => $admin->id,
            'causer_name' => $admin->name,
        ]);
    }
}
