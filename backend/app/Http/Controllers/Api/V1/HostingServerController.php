<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HostingServer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HostingServerController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(HostingServer::with(['customer', 'domain'])->get());
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->has('company_id') && ! $request->has('customer_id')) {
            $request->merge(['customer_id' => $request->input('company_id')]);
        }

        $validated = $request->validate([
            'server_name' => ['required', 'string', 'max:255'],
            'customer_id' => ['nullable', 'exists:companies,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'purpose' => ['nullable', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:100'],
            'ip_address' => ['nullable', 'string', 'max:50'],
            'plan' => ['nullable', 'string', 'max:100'],
            'purchase_date' => ['nullable', 'date'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'renew_date' => ['nullable', 'date'],
            'domain_id' => ['nullable', 'exists:hosting_domains,id'],
            'status' => ['nullable', 'string', 'in:Active,Inactive,Terminated'],
        ]);

        $server = HostingServer::create($validated);

        return response()->json($server, 201);
    }
}
