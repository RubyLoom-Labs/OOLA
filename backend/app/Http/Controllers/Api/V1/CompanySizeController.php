<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanySizeResource;
use App\Models\CompanySize;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanySizeController extends Controller
{
    /**
     * Display a listing of active company sizes (status = 1).
     */
    public function index(Request $request): JsonResponse
    {
        $query = CompanySize::query();

        // If 'all' flag is not set, only return active sizes (status = 1)
        if (! $request->boolean('all')) {
            $query->active();
        }

        $companySizes = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'data' => CompanySizeResource::collection($companySizes),
        ]);
    }

    /**
     * Store a newly created company size.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:company_sizes,name'],
            'status' => ['nullable', 'boolean'],
        ]);

        $companySize = CompanySize::create($validated);

        return (new CompanySizeResource($companySize))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified company size.
     */
    public function show(CompanySize $companySize): CompanySizeResource
    {
        return new CompanySizeResource($companySize);
    }

    /**
     * Update the specified company size.
     */
    public function update(Request $request, CompanySize $companySize): CompanySizeResource
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', 'unique:company_sizes,name,'.$companySize->id],
            'status' => ['nullable', 'boolean'],
        ]);

        $companySize->update($validated);

        return new CompanySizeResource($companySize);
    }

    /**
     * Remove the specified company size.
     */
    public function destroy(CompanySize $companySize): JsonResponse
    {
        $companySize->logicalDelete();

        return response()->json(['message' => 'Company size removed successfully.']);
    }
}
