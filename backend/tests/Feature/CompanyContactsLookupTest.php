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

    public function test_can_retrieve_active_contacts_id_and_names_by_company_id(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // 1. Target Company
        $companyA = Company::first(); // e.g. Apex Global Logistics

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

        // Endpoint 1: GET /api/v1/companies/{id}/contacts
        $response1 = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/{$companyA->id}/contacts");
        $response1->assertStatus(200)
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

        $ids1 = collect($response1->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeContactA->id, $ids1);
        $this->assertNotContains($inactiveContactA->id, $ids1);
        $this->assertNotContains($deletedContactA->id, $ids1);
        $this->assertNotContains($contactB->id, $ids1);

        // Ensure name properties are formatted
        $contactPayload = collect($response1->json('data'))->firstWhere('id', $activeContactA->id);
        $this->assertEquals('John Doe', $contactPayload['name']);
        $this->assertEquals('John', $contactPayload['first_name']);
        $this->assertEquals('Doe', $contactPayload['last_name']);
        $this->assertEquals(1, $contactPayload['status']);
        $this->assertEquals(0, $contactPayload['is_delete']);

        // Endpoint 2: GET /api/v1/contacts/by-company/{companyId}
        $response2 = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts/by-company/{$companyA->id}");
        $response2->assertStatus(200);
        $ids2 = collect($response2->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeContactA->id, $ids2);
        $this->assertNotContains($inactiveContactA->id, $ids2);
        $this->assertNotContains($deletedContactA->id, $ids2);
        $this->assertNotContains($contactB->id, $ids2);

        // Endpoint 3: GET /api/v1/companies/contacts?company_id={id}
        $response3 = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/companies/contacts?company_id={$companyA->id}");
        $response3->assertStatus(200);
        $ids3 = collect($response3->json('data'))->pluck('id')->toArray();
        $this->assertContains($activeContactA->id, $ids3);
        $this->assertNotContains($inactiveContactA->id, $ids3);
        $this->assertNotContains($deletedContactA->id, $ids3);
        $this->assertNotContains($contactB->id, $ids3);
    }
}
