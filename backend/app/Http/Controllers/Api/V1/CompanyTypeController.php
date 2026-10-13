<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyTypeResource;
use App\Models\CompanyType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyTypeController extends Controller
{
    /**
     * Display a listing of active company types (status = 1).
     */
    public function index(Request $request): JsonResponse
    {
        $query = CompanyType::query();

        // If 'all' flag is not set, only return active types (status = 1)
        if (! $request->boolean('all')) {
            $query->active();
        }

        $companyTypes = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => CompanyTypeResource::collection($companyTypes),
        ]);
    }

    /**
     * Store a newly created company type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:company_types,name'],
            'status' => ['nullable', 'boolean'],
        ]);

        $companyType = CompanyType::create($validated);

        return (new CompanyTypeResource($companyType))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified company type.
     */
    public function show(CompanyType $companyType): CompanyTypeResource
    {
        return new CompanyTypeResource($companyType);
    }

    /**
     * Update the specified company type.
     */
    public function update(Request $request, CompanyType $companyType): CompanyTypeResource
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', 'unique:company_types,name,'.$companyType->id],
            'status' => ['nullable', 'boolean'],
        ]);

        $companyType->update($validated);

        return new CompanyTypeResource($companyType);
    }

    /**
     * Remove the specified company type.
     */
    public function destroy(CompanyType $companyType): JsonResponse
    {
        $companyType->logicalDelete();

        return response()->json(['message' => 'Company type removed successfully.']);
    }
}
