<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Project;
use App\Models\ProjectPriority;
use App\Models\ProjectStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class IsDeleteStrictExclusionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_deleted_company_cannot_be_retrieved_anywhere(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();

        // Active company works
        $showActive = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}");
        $showActive->assertStatus(200);

        // Soft delete company (is_delete = 1)
        $company->logicalDelete();
        $this->assertTrue($company->fresh()->is_delete);

        // 1. GET /api/v1/companies/{id} should return 404
        $showDeleted = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}");
        $showDeleted->assertStatus(404);

        // 2. GET /api/v1/companies list should NOT contain the deleted company
        $listResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies');
        $listResponse->assertStatus(200);
        $companyIds = collect($listResponse->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($company->id, $companyIds);

        // 3. GET /api/v1/companies/lookup should NOT contain the deleted company
        $lookupResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies/lookup');
        $lookupResponse->assertStatus(200);
        $lookupIds = collect($lookupResponse->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($company->id, $lookupIds);

        // 4. Querying contacts of deleted company should return 404
        $contactsResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}/contacts");
        $contactsResponse->assertStatus(404);

        // 5. Querying users of deleted company should return 404
        $usersResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}/users");
        $usersResponse->assertStatus(404);
    }

    public function test_deleted_contact_cannot_be_retrieved_anywhere(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();

        $activeContact = Contact::create([
            'company_id' => $company->id,
            'first_name' => 'Active',
            'last_name' => 'Contact',
            'email' => 'active@example.com',
            'status' => true,
            'is_delete' => false,
        ]);

        $deletedContact = Contact::create([
            'company_id' => $company->id,
            'first_name' => 'Deleted',
            'last_name' => 'Contact',
            'email' => 'deleted@example.com',
            'status' => true,
            'is_delete' => true,
        ]);

        // 1. GET /api/v1/contacts should NOT contain the deleted contact
        $list = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/contacts');
        $list->assertStatus(200);
        $contactIds = collect($list->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeContact->id, $contactIds);
        $this->assertNotContains($deletedContact->id, $contactIds);

        // 2. GET /api/v1/contacts/{id} for deleted contact must return 404
        $show = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts/{$deletedContact->id}");
        $show->assertStatus(404);

        // 3. GET /api/v1/companies/{id}/contacts must NOT contain deleted contact
        $byCompany = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}/contacts");
        $byCompany->assertStatus(200);
        $byCompanyIds = collect($byCompany->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeContact->id, $byCompanyIds);
        $this->assertNotContains($deletedContact->id, $byCompanyIds);

        // 4. Company eager loading contacts must NOT include deleted contact
        $companyShow = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}");
        $companyShow->assertStatus(200);
        $loadedContactIds = collect($companyShow->json('data.contacts'))->pluck('id')->toArray();
        $this->assertNotContains($deletedContact->id, $loadedContactIds);
    }

    public function test_deleted_user_cannot_be_retrieved_or_invited(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        $deletedUser = User::create([
            'name' => 'Ghost User',
            'email' => 'ghost@example.com',
            'password' => Hash::make('secret'),
            'status' => 'Active',
            'is_delete' => true,
        ]);

        // 1. GET /api/v1/users list should NOT contain deleted user
        $usersList = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/users');
        $usersList->assertStatus(200);
        $userIds = collect($usersList->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($deletedUser->id, $userIds);

        // 2. GET /api/v1/users/{id} for deleted user must return 404
        $showUser = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/users/{$deletedUser->id}");
        $showUser->assertStatus(404);

        // 3. Resend invite for deleted user must return 404 (not found)
        $resend = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/users/{$deletedUser->id}/resend-invite");
        $resend->assertStatus(404);

        // 4. Login for deleted user must fail
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'ghost@example.com',
            'password' => 'secret',
        ]);
        $login->assertStatus(422);
    }

    public function test_deleted_project_and_tasks_cannot_be_retrieved(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();

        $deletedProject = Project::create([
            'company_id' => $company->id,
            'customer_id' => $company->id,
            'project_code' => 'PROJ-DEL-01',
            'project_title' => 'Deleted Architecture Project',
            'status' => 'In Progress',
            'is_delete' => true,
        ]);

        $activeProject = Project::create([
            'company_id' => $company->id,
            'customer_id' => $company->id,
            'project_code' => 'PROJ-ACT-01',
            'project_title' => 'Live Architecture Project',
            'status' => 'In Progress',
            'is_delete' => false,
        ]);

        // Deleted task on active project
        $deletedTask = Task::create([
            'taskable_type' => 'project',
            'taskable_id' => $activeProject->id,
            'title' => 'Deleted Task',
            'status' => 'Pending',
            'is_delete' => true,
        ]);

        // 1. Projects index does not contain deleted project
        $projectsList = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/projects');
        $projectsList->assertStatus(200);
        $projectIds = collect($projectsList->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($deletedProject->id, $projectIds);
        $this->assertContains($activeProject->id, $projectIds);

        // 2. GET /api/v1/projects/{id} on deleted project returns 404
        $showProject = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$deletedProject->id}");
        $showProject->assertStatus(404);

        // 3. GET /api/v1/tasks on deleted task returns 404
        $showTask = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/tasks/{$deletedTask->id}");
        $showTask->assertStatus(404);
    }

    public function test_deleted_activity_logs_and_project_statuses_cannot_be_retrieved(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        $deletedLog = ActivityLog::create([
            'action' => 'Sensitive Event',
            'description' => 'Should be hidden from FE',
            'created_at' => now(),
            'is_delete' => true,
        ]);

        $deletedStatus = ProjectStatus::create([
            'name' => 'Hidden Obsolete Status',
            'order_column' => 99,
            'is_delete' => true,
        ]);

        $deletedPriority = ProjectPriority::create([
            'name' => 'Hidden Obsolete Priority',
            'order_column' => 99,
            'is_delete' => true,
        ]);

        // 1. Activity logs index does NOT contain is_delete = 1 log
        $logs = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/activity-logs');
        $logs->assertStatus(200);
        $logIds = collect($logs->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($deletedLog->id, $logIds);

        // 2. Project statuses index does NOT contain is_delete = 1 status
        $statuses = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-statuses');
        $statuses->assertStatus(200);
        $statusIds = collect($statuses->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($deletedStatus->id, $statusIds);

        // 3. Single project status show returns 404
        $showStatus = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-statuses/{$deletedStatus->id}");
        $showStatus->assertStatus(404);

        // 4. Project priorities index does NOT contain is_delete = 1 priority
        $priorities = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/project-priorities');
        $priorities->assertStatus(200);
        $priorityIds = collect($priorities->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($deletedPriority->id, $priorityIds);

        // 5. Single project priority show returns 404
        $showPriority = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/project-priorities/{$deletedPriority->id}");
        $showPriority->assertStatus(404);
    }

    public function test_company_contacts_strictly_requires_active_company_and_contacts(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();

        $activeContact = Contact::create([
            'company_id' => $company->id,
            'first_name' => 'Valid',
            'last_name' => 'Contact',
            'status' => true,
            'is_delete' => false,
        ]);

        $inactiveContact = Contact::create([
            'company_id' => $company->id,
            'first_name' => 'Inactive',
            'last_name' => 'Contact',
            'status' => false,
            'is_delete' => false,
        ]);

        $deletedContact = Contact::create([
            'company_id' => $company->id,
            'first_name' => 'Deleted',
            'last_name' => 'Contact',
            'status' => true,
            'is_delete' => true,
        ]);

        // 1. Successful fetch on active company
        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}/contacts");
        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeContact->id, $ids);
        $this->assertNotContains($inactiveContact->id, $ids);
        $this->assertNotContains($deletedContact->id, $ids);

        // 2. When company status = 0 (inactive), returns 404
        $company->update(['status' => false]);
        $inactiveResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}/contacts");
        $inactiveResponse->assertStatus(404);

        // 3. When company is_delete = 1, returns 404
        $company->update(['status' => true, 'is_delete' => true]);
        $deletedResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$company->id}/contacts");
        $deletedResponse->assertStatus(404);
    }
}
