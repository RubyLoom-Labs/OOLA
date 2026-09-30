<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\CompanySize;
use App\Models\CompanyType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_fetch_active_company_types_and_sizes_endpoints(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // 1. Company types endpoint
        $typesResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/company-types');
        $typesResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'status', 'created_at', 'updated_at'],
                ],
            ]);

        $this->assertNotEmpty($typesResponse->json('data'));

        // 2. Company sizes endpoint
        $sizesResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/company-sizes');
        $sizesResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'status', 'created_at', 'updated_at'],
                ],
            ]);

        $this->assertNotEmpty($sizesResponse->json('data'));
    }

    public function test_can_get_next_company_code_in_ascending_order(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies/next-code');
        $response->assertStatus(200)
            ->assertJsonStructure(['next_code']);

        $nextCode = $response->json('next_code');
        $this->assertMatchesRegularExpression('/^CO\d{6}$/', $nextCode);
    }

    public function test_can_fetch_active_companies_lookup_with_only_id_and_company_name(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $type = CompanyType::first();

        // Create an inactive company
        Company::create([
            'company_name' => 'Inactive Stealth Corp',
            'company_type_id' => $type->id,
            'email' => 'stealth@test.com',
            'status' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies/lookup');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'company_name', 'company_code'],
                ],
            ]);

        $companyNames = collect($response->json('data'))->pluck('company_name')->toArray();
        $this->assertContains('Apex Global Logistics', $companyNames);
        $this->assertNotContains('Inactive Stealth Corp', $companyNames);

        // Search by company name
        $searchResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies/lookup?search=Apex');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.company_name', 'Apex Global Logistics');

        // Search by company code
        $codeResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies/lookup?search=CO000001');
        $codeResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.company_code', 'CO000001');
    }

    public function test_can_create_company_with_auto_generated_code_and_exact_fields(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $type = CompanyType::first();
        $size = CompanySize::first();

        $payload = [
            'company_name' => 'Zenith Tech Solutions',
            'company_type_id' => $type->id,
            'email' => 'hello@zenithtech.io',
            'industry' => 'Information Technology',
            'company_size_id' => $size->id,
            'status' => true,
            'company_description' => 'Cloud and cybersecurity consulting services.',
            'website' => 'https://zenithtech.io',
            'owner_name' => 'Marcus Aurelius',
            'owner_birthday' => '1985-09-20',
            'address_line_1' => 'Suite 500, Cyber Tower',
            'address_line_2' => 'Silicon Boulevard',
            'city' => 'Colombo',
            'state' => 'Western Province',
            'postal_code' => '00100',
            'country' => 'Sri Lanka',
            'phone_numbers' => [
                [
                    'phone_number' => '+94 11 999 8888',
                    'type' => 'Work',
                    'is_primary' => true,
                    'is_whatsapp' => true,
                    'notes' => 'Primary office reception',
                ],
                [
                    'phone_number' => '+94 77 333 4444',
                    'type' => 'Mobile',
                    'is_primary' => false,
                    'is_whatsapp' => false,
                    'notes' => 'Sales director hotline',
                ],
            ],
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/companies', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.company_name', 'Zenith Tech Solutions')
            ->assertJsonPath('data.company_type_id', $type->id)
            ->assertJsonPath('data.email', 'hello@zenithtech.io')
            ->assertJsonPath('data.status', true)
            ->assertJsonPath('data.owner_name', 'Marcus Aurelius')
            ->assertJsonPath('data.owner_birthday', '1985-09-20')
            ->assertJsonPath('data.address_line_1', 'Suite 500, Cyber Tower')
            ->assertJsonPath('data.city', 'Colombo')
            ->assertJsonCount(2, 'data.phone_numbers');

        $companyCode = $response->json('data.company_code');
        $this->assertNotEmpty($companyCode);
        $this->assertStringStartsWith('CO', $companyCode);

        $this->assertDatabaseHas('companies', [
            'company_name' => 'Zenith Tech Solutions',
            'company_code' => $companyCode,
            'email' => 'hello@zenithtech.io',
            'status' => 1,
        ]);
    }

    public function test_company_code_increments_sequentially(): void
    {
        $type = CompanyType::first();

        $c1 = Company::create([
            'company_name' => 'Alpha Co',
            'company_type_id' => $type->id,
            'email' => 'alpha@test.com',
        ]);

        $c2 = Company::create([
            'company_name' => 'Beta Co',
            'company_type_id' => $type->id,
            'email' => 'beta@test.com',
        ]);

        $this->assertNotEmpty($c1->company_code);
        $this->assertNotEmpty($c2->company_code);

        $num1 = (int) substr($c1->company_code, 2);
        $num2 = (int) substr($c2->company_code, 2);

        $this->assertEquals($num1 + 1, $num2);
    }

    public function test_logical_delete_company_never_returns_in_index(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $type = CompanyType::first();

        $company = Company::create([
            'company_name' => 'Deletable Corp',
            'company_type_id' => $type->id,
            'email' => 'delete.me@corp.com',
        ]);

        $companyId = $company->id;

        // Delete company
        $delResponse = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/companies/{$companyId}");
        $delResponse->assertStatus(200);

        // Index does not return deleted company
        $indexResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/companies');
        $indexResponse->assertStatus(200);

        $ids = collect($indexResponse->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($companyId, $ids);

        // Restore
        $restoreResponse = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/companies/{$companyId}/restore");
        $restoreResponse->assertStatus(200)
            ->assertJsonPath('data.company_name', 'Deletable Corp');

        $this->assertNotNull(Company::find($companyId));
    }
}
