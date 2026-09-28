<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HostingServiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(HostingService::with('customer')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_type' => ['required', 'string', 'max:100'],
            'customer_id' => ['required', 'exists:customers,id'],
            'provider' => ['nullable', 'string', 'max:100'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'renew_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $service = HostingService::create($validated);
        return response()->json($service, 201);
    }
}
