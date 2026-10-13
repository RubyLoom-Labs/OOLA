<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Http\Requests\Company\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    /**
     * Display a paginated listing of companies with filtering and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Company::with(['companyType', 'companySize'])
            ->withCount(['contacts', 'leads', 'projects']);

        // Filter by status (boolean or 1/0)
        if ($request->has('status') && $request->input('status') !== null && $request->input('status') !== '') {
            $query->where('status', $request->boolean('status'));
        }

        // Filter by company_type_id
        if ($request->filled('company_type_id')) {
            $query->where('company_type_id', (int) $request->input('company_type_id'));
        }

        // Filter by company_size_id
        if ($request->filled('company_size_id')) {
            $query->where('company_size_id', (int) $request->input('company_size_id'));
        }

        // Filter by industry
        if ($request->filled('industry')) {
            $query->where('industry', $request->input('industry'));
        }

        // Safe parameterized search against SQL injection
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('company_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('owner_name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('industry', 'like', "%{$search}%");
            });
        }

        // Sorting
        $allowedSortColumns = [
            'id',
            'company_code',
            'company_name',
            'email',
            'phone_number',
            'status',
            'created_at',
            'updated_at',
        ];

        $sortBy = in_array($request->input('sort_by'), $allowedSortColumns, true)
            ? $request->input('sort_by')
            : 'id';

        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage > 0) {
            $companies = $query->paginate($perPage);

            return response()->json([
                'data' => CompanyResource::collection($companies),
                'meta' => [
                    'current_page' => $companies->currentPage(),
                    'last_page' => $companies->lastPage(),
                    'per_page' => $companies->perPage(),
                    'total' => $companies->total(),
                ],
            ]);
        }

        return response()->json(CompanyResource::collection($query->get()));
    }

    /**
     * Get the next upcoming company code.
     */
    public function nextCode(): JsonResponse
    {
        return response()->json([
            'next_code' => Company::generateCompanyCode(),
        ]);
    }

    /**
     * Fetch active companies (status = 1) returning only id, company_name, and company_code with optional search by name or code.
     */
    public function lookup(Request $request): JsonResponse
    {
        $query = Company::where('status', true);

        // Search by name or code (supports 'search', 'q', 'name', or 'code')
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('company_code', 'like', "%{$search}%");
            });
        } elseif ($request->filled('q')) {
            $search = trim($request->input('q'));
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('company_code', 'like', "%{$search}%");
            });
        } else {
            if ($request->filled('name')) {
                $query->where('company_name', 'like', '%'.trim($request->input('name')).'%');
            }
            if ($request->filled('code')) {
                $query->where('company_code', 'like', '%'.trim($request->input('code')).'%');
            }
        }

        if ($request->filled('limit')) {
            $query->limit((int) $request->input('limit'));
        }

        $companies = $query->orderBy('company_name', 'asc')
            ->select(['id', 'company_name', 'company_code'])
            ->get();

        return response()->json([
            'data' => $companies->map(function ($c) {
                return [
                    'id' => $c->id,
                    'company_name' => $c->company_name,
                    'company_code' => $c->company_code,
                ];
            }),
        ]);
    }

    /**
     * Store a newly created company.
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Handle file upload for logo if present
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company_logos', 'public');
            $validated['logo'] = $path;
        }

        $company = Company::create($validated);

        ActivityLogger::log('Company Created', "Created company: {$company->company_name} ({$company->company_code})", $company);

        return (new CompanyResource($company->load(['companyType', 'companySize'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified company.
     */
    public function show(Company $company): CompanyResource
    {
        return new CompanyResource($company->load(['companyType', 'companySize', 'contacts']));
    }

    /**
     * Update the specified company.
     */
    public function update(UpdateCompanyRequest $request, Company $company): CompanyResource
    {
        $validated = $request->validated();

        if ($request->hasFile('logo')) {
            if ($company->logo && Storage::disk('public')->exists($company->logo)) {
                Storage::disk('public')->delete($company->logo);
            }
            $path = $request->file('logo')->store('company_logos', 'public');
            $validated['logo'] = $path;
        }

        $company->update($validated);

        ActivityLogger::log('Company Updated', "Updated company: {$company->company_name} ({$company->company_code})", $company);

        return new CompanyResource($company->load(['companyType', 'companySize', 'contacts']));
    }

    /**
     * Remove the specified company (logical delete).
     */
    public function destroy(Company $company): JsonResponse
    {
        $company->logicalDelete();
        ActivityLogger::log('Company Deleted', "Deleted company: {$company->company_name} ({$company->company_code})", $company);

        return response()->json(['message' => 'Company removed successfully.']);
    }

    /**
     * Restore a logically deleted company.
     */
    public function restore(int $id): JsonResponse
    {
        $company = Company::withoutGlobalScopes()->where('is_delete', true)->findOrFail($id);
        $company->restore();
        ActivityLogger::log('Company Restored', "Restored company: {$company->company_name} ({$company->company_code})", $company);

        return response()->json([
            'message' => 'Company restored successfully.',
            'data' => new CompanyResource($company->load(['companyType', 'companySize'])),
        ]);
    }
}
