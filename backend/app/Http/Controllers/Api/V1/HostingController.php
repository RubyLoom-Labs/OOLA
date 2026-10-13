<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\HostingResource;
use App\Models\HostingDomain;
use App\Models\HostingServer;
use App\Models\HostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HostingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type', 'domain');

        if ($type === 'server') {
            $records = HostingServer::with('customer')->latest()->paginate(15);
        } elseif ($type === 'service') {
            $records = HostingService::with('customer')->latest()->paginate(15);
        } else {
            $records = HostingDomain::with('customer')->latest()->paginate(15);
        }

        return HostingResource::collection($records)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:domain,server,service'],
            'customer_id' => ['required', 'exists:customers,id'],
            'name' => ['required', 'string'],
            'provider' => ['nullable', 'string'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'renew_date' => ['nullable', 'date'],
        ]);

        $type = $request->input('type');
        $data = [
            'customer_id' => $request->input('customer_id'),
            'provider' => $request->input('provider'),
            'cost_price' => $request->input('cost_price', 0),
            'selling_price' => $request->input('selling_price', 0),
            'renew_date' => $request->input('renew_date'),
            'status' => 'Active',
        ];

        if ($type === 'server') {
            $data['server_name'] = $request->input('name');
            $record = HostingServer::create($data);
        } elseif ($type === 'service') {
            $data['service_type'] = $request->input('name');
            $record = HostingService::create($data);
        } else {
            $data['domain_name'] = $request->input('name');
            $record = HostingDomain::create($data);
        }

        return response()->json([
            'message' => ucfirst($type).' record created successfully',
            'data' => new HostingResource($record->load('customer')),
        ], 201);
    }
}
