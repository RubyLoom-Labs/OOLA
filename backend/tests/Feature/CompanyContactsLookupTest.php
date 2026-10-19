<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyContactsLookupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_retrieve_active_contacts_for_active_company_via_single_endpoint(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // 1. Target Company (status = 1, is_delete = 0)
        $companyA = Company::first();

        // Active contact for Company A (status = 1, is_delete = 0)
        $activeContactA = Contact::create([
            'company_id' => $companyA->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@company-a.com',
            'status' => true,
            'is_delete' => false,
        ]);

        // Inactive contact for Company A (status = 0, is_delete = 0) - Should NOT be returned
        $inactiveContactA = Contact::create([
            'company_id' => $companyA->id,
            'first_name' => 'Inactive',
            'last_name' => 'Person',
            'email' => 'inactive@company-a.com',
            'status' => false,
            'is_delete' => false,
        ]);

        // Deleted contact for Company A (status = 1, is_delete = 1) - Should NOT be returned
        $deletedContactA = Contact::create([
            'company_id' => $companyA->id,
            'first_name' => 'Deleted',
            'last_name' => 'Person',
            'email' => 'deleted@company-a.com',
            'status' => true,
            'is_delete' => true,
        ]);

        // 2. Another Company
        $companyB = Company::create([
            'company_name' => 'Other Tech Corp',
            'company_type_id' => $companyA->company_type_id,
            'email' => 'contact@othertech.com',
            'status' => true,
        ]);

        // Active contact for Company B - Should NOT be returned when querying Company A
        $contactB = Contact::create([
            'company_id' => $companyB->id,
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'email' => 'alice@othertech.com',
            'status' => true,
            'is_delete' => false,
        ]);

        // The ONLY allowed endpoint: GET /api/v1/companies/{id}/contacts
        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$companyA->id}/contacts");
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'full_name',
                        'first_name',
                        'last_name',
                        'company_id',
                        'status',
                        'is_delete',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $ids = collect($data)->pluck('id')->toArray();
        $this->assertContains($activeContactA->id, $ids);
        $this->assertNotContains($inactiveContactA->id, $ids);
        $this->assertNotContains($deletedContactA->id, $ids);
        $this->assertNotContains($contactB->id, $ids);

        // Ensure payload properties
        $contactPayload = collect($data)->firstWhere('id', $activeContactA->id);
        $this->assertEquals('John Doe', $contactPayload['name']);
        $this->assertEquals('John', $contactPayload['first_name']);
        $this->assertEquals('Doe', $contactPayload['last_name']);
        $this->assertEquals(1, $contactPayload['status']);
        $this->assertEquals(0, $contactPayload['is_delete']);

        // Verify other endpoints are permanently removed
        $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts/by-company/{$companyA->id}")->assertStatus(404);
        $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/contacts?company_id={$companyA->id}")->assertStatus(404);
        $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$companyA->id}/users")->assertStatus(404);
    }

    public function test_inactive_or_deleted_company_returns_404_and_no_contacts(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $type = Company::first()->company_type_id;

        // Inactive company (status = 0, is_delete = 0)
        $inactiveCompany = Company::create([
            'company_name' => 'Inactive Corp',
            'company_type_id' => $type,
            'email' => 'inactive@corp.com',
            'status' => false,
            'is_delete' => false,
        ]);
        Contact::create([
            'company_id' => $inactiveCompany->id,
            'first_name' => 'ShouldNotSee',
            'last_name' => 'Me',
            'status' => true,
            'is_delete' => false,
        ]);

        $inactiveResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$inactiveCompany->id}/contacts");
        $inactiveResponse->assertStatus(404);

        // Deleted company (status = 1, is_delete = 1)
        $deletedCompany = Company::create([
            'company_name' => 'Deleted Corp',
            'company_type_id' => $type,
            'email' => 'deleted@corp.com',
            'status' => true,
            'is_delete' => true,
        ]);
        Contact::create([
            'company_id' => $deletedCompany->id,
            'first_name' => 'Ghost',
            'last_name' => 'Contact',
            'status' => true,
            'is_delete' => false,
        ]);

        $deletedResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$deletedCompany->id}/contacts");
        $deletedResponse->assertStatus(404);
    }
}
