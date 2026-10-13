<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function __construct(protected CustomerService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = $this->service->getList($request->all(), (int) $request->get('per_page', 15));

        return CustomerResource::collection($customers);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->service->createCustomer($request->validated());

        return (new CustomerResource($customer->load(['contacts', 'phoneNumbers', 'primaryPhoneNumber'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Customer $customer): CustomerResource
    {
        return new CustomerResource($customer->load(['contacts', 'phoneNumbers', 'primaryPhoneNumber', 'leads', 'projects', 'quotations', 'payments']));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer = $this->service->updateCustomer($customer, $request->validated());

        return new CustomerResource($customer->load(['contacts', 'phoneNumbers', 'primaryPhoneNumber']));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->service->deleteCustomer($customer);

        return response()->json(['message' => 'Customer archived successfully (logical delete).']);
    }

    public function restore(int $id): JsonResponse
    {
        $customer = Customer::withoutGlobalScopes()->where('is_delete', true)->findOrFail($id);
        $customer->restore();

        return response()->json(['message' => 'Customer restored successfully.']);
    }
}
