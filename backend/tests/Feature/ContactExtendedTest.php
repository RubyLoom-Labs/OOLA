<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Customer;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactExtendedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $response = $this->getJson('/api/v1/contacts');
        $response->assertStatus(401);

        $storeResponse = $this->postJson('/api/v1/contacts', [
            'company' => 'Acme Corp',
        ]);
        $storeResponse->assertStatus(401);
    }

    public function test_can_create_contact_with_cleaned_properties_and_multiple_phones(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $customer = Customer::first();

        $payload = [
            'company_id' => $customer->id,
            'company' => 'Nexus Global Innovations',
            'first_name' => 'Alexander',
            'last_name' => 'Vance',
            'designation' => 'Chief Executive Officer',
            'email' => 'alex@nexusglobal.com',
            'phone' => '+94 77 123 4567',
            'website' => 'https://nexusglobal.io',
            'address' => '100 Innovation Way, Colombo 03',
            'birthday' => '1988-06-15',
            'status' => 'Active',
            'phone_numbers' => [
                [
                    'phone_number' => '+94 77 123 4567',
                    'type' => 'Mobile',
                    'is_primary' => true,
                    'is_whatsapp' => true,
                    'notes' => 'Direct VIP mobile',
                ],
                [
                    'phone_number' => '+94 11 200 3000',
                    'type' => 'Work',
                    'is_primary' => false,
                    'is_whatsapp' => false,
                    'notes' => 'HQ Reception',
                ],
            ],
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/contacts', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.company_id', $customer->id)
            ->assertJsonPath('data.company_name', 'Nexus Global Innovations')
            ->assertJsonPath('data.first_name', 'Alexander')
            ->assertJsonPath('data.last_name', 'Vance')
            ->assertJsonPath('data.full_name', 'Alexander Vance')
            ->assertJsonPath('data.designation', 'Chief Executive Officer')
            ->assertJsonPath('data.email', 'alex@nexusglobal.com')
            ->assertJsonPath('data.phone', '+94 77 123 4567')
            ->assertJsonPath('data.website', 'https://nexusglobal.io')
            ->assertJsonPath('data.address', '100 Innovation Way, Colombo 03')
            ->assertJsonPath('data.birthday', '1988-06-15')
            ->assertJsonPath('data.status', 'Active')
            ->assertJsonCount(2, 'data.phone_numbers');

        $contactId = $response->json('data.id');
        $this->assertDatabaseHas('contacts', [
            'id' => $contactId,
            'company_id' => $customer->id,
            'company' => 'Nexus Global Innovations',
            'first_name' => 'Alexander',
            'last_name' => 'Vance',
            'email' => 'alex@nexusglobal.com',
            'status' => 'Active',
        ]);
    }

    public function test_projects_history_and_count_endpoint(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $contact = Contact::first();
        $project = Project::first();

        // Direct link project to contact
        $project->update(['contact_id' => $contact->id]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts/{$contact->id}/projects");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'contact_id',
                'company',
                'full_name',
                'projects_count',
                'projects' => [
                    '*' => [
                        'id',
                        'project_code',
                        'project_title',
                        'status',
                        'stage',
                        'budget',
                        'quoted_amount',
                    ],
                ],
            ]);
    }

    public function test_show_contact_endpoint_returns_contact_company_and_project_details(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $contact = Contact::first();
        $project = Project::first();

        // Attach project to contact
        $project->update(['contact_id' => $contact->id]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts/{$contact->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $contact->id)
            ->assertJsonPath('data.company_name', 'Apex Global Logistics')
            ->assertJsonPath('data.first_name', 'Sarah')
            ->assertJsonPath('data.last_name', 'Connor')
            ->assertJsonPath('data.email', 'sarah.c@apexlogistics.com')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'company_id',
                    'company_name',
                    'first_name',
                    'last_name',
                    'full_name',
                    'email',
                    'phone',
                    'designation',
                    'status',
                    'phone_numbers',
                    'company' => [
                        'id',
                        'company_code',
                        'company_name',
                        'email',
                    ],
                    'projects' => [
                        '*' => [
                            'id',
                            'project_code',
                            'project_title',
                            'status',
                            'stage',
                            'budget',
                        ],
                    ],
                ],
            ]);
    }

    public function test_sql_injection_safe_search_and_sorting(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();

        // SQL injection payload in search
        $injectionSearch = "Apex' OR '1'='1";
        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts?search=" . urlencode($injectionSearch));
        $response->assertStatus(200);

        // SQL injection payload in sort_by
        $injectionSort = "id; DROP TABLE contacts; --";
        $sortResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/contacts?sort_by=" . urlencode($injectionSort));
        $sortResponse->assertStatus(200); // Falls back to default sort without executing rogue SQL

        // Assert contacts table is completely intact
        $this->assertTrue(Contact::count() > 0);
    }

    public function test_contact_logical_delete_and_restore(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $contact = Contact::create([
            'company' => 'Deletable Contact Corp',
            'first_name' => 'Temporary',
            'last_name' => 'Contact',
            'email' => 'temp.contact@deletable.com',
        ]);

        $contactId = $contact->id;

        // Logical delete
        $deleteResponse = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/contacts/{$contactId}");
        $deleteResponse->assertStatus(200);

        // Excluded from standard queries
        $this->assertNull(Contact::find($contactId));

        // Restore
        $restoreResponse = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/contacts/{$contactId}/restore");
        $restoreResponse->assertStatus(200)
            ->assertJsonPath('data.company_name', 'Deletable Contact Corp');

        $this->assertNotNull(Contact::find($contactId));
    }
}
