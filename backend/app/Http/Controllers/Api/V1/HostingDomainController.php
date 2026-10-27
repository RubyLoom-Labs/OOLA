<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HostingDomainResource;
use App\Models\HostingDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HostingDomainController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = HostingDomain::with(['customer', 'contact']);
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return HostingDomainResource::collection($query->latest()->paginate((int) $request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->has('company_id') && ! $request->has('customer_id')) {
            $request->merge(['customer_id' => $request->input('company_id')]);
        }

        $validated = $request->validate([
            'domain_name' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'exists:companies,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'provider' => ['nullable', 'string', 'max:100'],
            'purchase_date' => ['nullable', 'date'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'renew_date' => ['nullable', 'date'],
            'encrypted_credentials' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:Active,Expired,Pending Transfer'],
        ]);

        $domain = HostingDomain::create($validated);

        return (new HostingDomainResource($domain->load('customer')))->response()->setStatusCode(201);
    }

    public function show(HostingDomain $hostingDomain): HostingDomainResource
    {
        return new HostingDomainResource($hostingDomain->load(['customer', 'contact', 'servers']));
    }

    public function update(Request $request, HostingDomain $hostingDomain): HostingDomainResource
    {
        $hostingDomain->update($request->all());

        return new HostingDomainResource($hostingDomain->load('customer'));
    }

    public function destroy(HostingDomain $hostingDomain): JsonResponse
    {
        $hostingDomain->logicalDelete();

        return response()->json(['message' => 'Domain archived.']);
    }
}
