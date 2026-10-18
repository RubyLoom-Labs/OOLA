<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_code_generates_automatically_as_cus_and_six_digits(): void
    {
        $admin = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/customers', [
            'company_name' => 'First Dynamic Customer',
            'email' => 'first@dynamic.com',
            'status' => 'Active',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.customer_code', 'CUS000001');

        $this->assertDatabaseHas('customers', [
            'company_name' => 'First Dynamic Customer',
            'customer_code' => 'CUS000001',
        ]);
    }

    public function test_subsequent_customers_increment_code_sequentially(): void
    {
        $admin = User::factory()->create();

        $first = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/customers', [
            'company_name' => 'Customer One',
            'email' => 'one@customer.com',
        ]);
        $first->assertStatus(201)->assertJsonPath('data.customer_code', 'CUS000001');

        $second = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/customers', [
            'company_name' => 'Customer Two',
            'email' => 'two@customer.com',
        ]);
        $second->assertStatus(201)->assertJsonPath('data.customer_code', 'CUS000002');
    }

    public function test_customer_code_cannot_be_edited_or_updated(): void
    {
        $admin = User::factory()->create();

        $createResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/customers', [
            'company_name' => 'Immutable Code Corp',
            'email' => 'immutable@corp.com',
        ]);
        $customerId = $createResponse->json('data.id');
        $this->assertEquals('CUS000001', $createResponse->json('data.customer_code'));

        // Attempt to update customer_code
        $updateResponse = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/customers/{$customerId}", [
            'company_name' => 'Immutable Code Corp Updated',
            'customer_code' => 'CUS999999',
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.customer_code', 'CUS000001');

        $customer = Customer::find($customerId);
        $this->assertEquals('CUS000001', $customer->customer_code);

        // Direct Eloquent update attempt
        $customer->update(['customer_code' => 'CUS777777']);
        $customer->refresh();
        $this->assertEquals('CUS000001', $customer->customer_code);
    }

    public function test_customer_can_be_resolved_by_customer_code_or_id(): void
    {
        $admin = User::factory()->create();

        $createResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/customers', [
            'company_name' => 'Lookup Customer Corp',
            'email' => 'lookup@corp.com',
        ]);
        $customerId = $createResponse->json('data.id');
        $customerCode = $createResponse->json('data.customer_code');

        // Lookup by integer ID
        $byId = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/customers/{$customerId}");
        $byId->assertStatus(200)->assertJsonPath('data.company_name', 'Lookup Customer Corp');

        // Lookup by customer_code
        $byCode = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/customers/{$customerCode}");
        $byCode->assertStatus(200)->assertJsonPath('data.company_name', 'Lookup Customer Corp');
    }
}
