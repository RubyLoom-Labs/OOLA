<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\CompanyType;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProjectCompanyLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_customers_table_is_permanently_removed(): void
    {
        $this->assertFalse(Schema::hasTable('customers'));
    }

    public function test_project_get_endpoints_return_company_under_customer_key(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();

        $project = Project::create([
            'project_title' => 'Redesign Alpha Portal',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
            'budget' => 50000,
        ]);

        // 1. Get by ID
        $showResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$project->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.customer_id', $company->id)
            ->assertJsonPath('data.customer.id', $company->id)
            ->assertJsonPath('data.customer.company_name', $company->company_name)
            ->assertJsonPath('data.customer.company_code', $company->company_code)
            ->assertJsonPath('data.customer.email', $company->email);

        // 2. Index (List)
        $listResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/projects');
        $listResponse->assertStatus(200)
            ->assertJsonPath('data.0.customer.company_name', $company->company_name);

        // 3. Search by company name
        $searchResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects?search={$company->company_name}");
        $searchResponse->assertStatus(200)
            ->assertJsonPath('data.0.customer.company_name', $company->company_name);
    }

    public function test_project_can_be_created_and_updated_with_company_id_as_customer_id(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $type = CompanyType::first();

        $newCompany = Company::create([
            'company_name' => 'Acme Global Ventures',
            'company_type_id' => $type->id,
            'email' => 'contact@acmeglobal.com',
            'phone_number' => '+94 11 888 7777',
            'status' => true,
        ]);

        $stage = ProjectStage::first();

        // 1. Create project
        $createResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/projects', [
            'project_title' => 'Cloud Migration Project',
            'customer_id' => $newCompany->id,
            'stage_id' => $stage->id,
            'priority' => 'High',
            'status' => 'In Progress',
            'budget' => 75000,
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('data.project_title', 'Cloud Migration Project')
            ->assertJsonPath('data.customer_id', $newCompany->id)
            ->assertJsonPath('data.customer.company_name', 'Acme Global Ventures')
            ->assertJsonPath('data.customer.email', 'contact@acmeglobal.com');

        $projectId = $createResponse->json('data.id');

        // 2. Update project
        $updateResponse = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/projects/{$projectId}", [
            'project_title' => 'Cloud Migration Project Phase 2',
            'budget' => 90000,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.project_title', 'Cloud Migration Project Phase 2')
            ->assertJsonPath('data.budget', 90000)
            ->assertJsonPath('data.customer.company_name', 'Acme Global Ventures');
    }

    public function test_project_code_format_is_proj_company_code_without_c_and_sequential_number(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $type = CompanyType::first();

        // Seeded Apex Logistics has company_code = CO000001
        $apexCompany = Company::where('company_name', 'Apex Global Logistics')->first();
        $this->assertEquals('CO000001', $apexCompany->company_code);

        // Next project for Apex (second project for CO000001) should be PROJO0000012
        $nextCodeApex = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/next-code?customer_id={$apexCompany->id}");
        $nextCodeApex->assertStatus(200)
            ->assertJsonPath('next_code', 'PROJO0000012');

        // Create second project for Apex Logistics
        $apexProj2 = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/projects', [
            'project_title' => 'Apex Mobile App Phase 2',
            'customer_id' => $apexCompany->id,
        ]);
        $apexProj2->assertStatus(201)
            ->assertJsonPath('data.project_code', 'PROJO0000012');

        // Create a new Company (will be CO000002)
        $brandNewCompany = Company::create([
            'company_name' => 'Zenith Tech Solutions',
            'company_type_id' => $type->id,
            'email' => 'info@zenithtech.com',
            'status' => true,
        ]);
        $this->assertEquals('CO000002', $brandNewCompany->company_code);

        // Next code for first project of Zenith Tech Solutions should be PROJO0000021
        $nextCodeZenith1 = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/next-code?customer_id={$brandNewCompany->id}");
        $nextCodeZenith1->assertStatus(200)
            ->assertJsonPath('next_code', 'PROJO0000021');

        // Create 1st project for Zenith Tech Solutions
        $zenithProj1 = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/projects', [
            'project_title' => 'Zenith Core ERP',
            'customer_id' => $brandNewCompany->id,
        ]);
        $zenithProj1->assertStatus(201)
            ->assertJsonPath('data.project_code', 'PROJO0000021');

        // Create 2nd project for Zenith Tech Solutions
        $zenithProj2 = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/projects', [
            'project_title' => 'Zenith Warehouse Automation',
            'customer_id' => $brandNewCompany->id,
        ]);
        $zenithProj2->assertStatus(201)
            ->assertJsonPath('data.project_code', 'PROJO0000022');
    }
}
