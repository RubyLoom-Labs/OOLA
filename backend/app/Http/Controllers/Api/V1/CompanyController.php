<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Http\Requests\Company\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Models\Contact;
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
     * Retrieve active contacts (status = 1 and is_delete = 0) id and names for a company.
     * Accessible via GET /api/v1/companies/{id}/contacts or GET /api/v1/companies/contacts?company_id={id}
     */
    public function contacts(Request $request, ?int $id = null): JsonResponse
    {
        $companyId = $id ?: (int) ($request->input('company_id') ?: $request->input('customer_id'));

        if (! $companyId) {
            return response()->json([
                'message' => 'Company ID is required.',
                'data' => [],
            ], 422);
        }

        $contacts = Contact::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('status', true)
                    ->orWhere('status', 1)
                    ->orWhere('status', '1')
                    ->orWhere('status', 'Active');
            })
            ->where('is_delete', false)
            ->orderBy('first_name', 'asc')
            ->orderBy('last_name', 'asc')
            ->get();

        return response()->json([
            'data' => $contacts->map(function (Contact $c) {
                $fullName = trim("{$c->first_name} {$c->last_name}");
                $name = ! empty($fullName) ? $fullName : ($c->company ?? "Contact #{$c->id}");

                return [
                    'id' => $c->id,
                    'name' => $name,
                    'full_name' => $name,
                    'first_name' => $c->first_name,
                    'last_name' => $c->last_name,
                    'company_id' => $c->company_id,
                    'designation' => $c->designation,
                    'email' => $c->email,
                    'status' => (int) ($c->status ? 1 : 0),
                    'is_delete' => (int) ($c->is_delete ? 1 : 0),
                ];
            }),
        ]);
    }

    /**
     * Store a newly created company.
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $payload = $request->validated();

        if ($request->hasFile('logo') || $request->filled('logo')) {
            $logoPath = $this->handleLogo($request);
            if ($logoPath !== null) {
                $payload['logo'] = $logoPath;
            }
        } elseif ($request->exists('logo') && empty($request->input('logo'))) {
            $payload['logo'] = null;
        }

        $company = Company::create($payload);

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
        $payload = $request->validated();

        if ($request->hasFile('logo') || $request->filled('logo') || $request->exists('logo')) {
            $payload['logo'] = $this->handleLogo($request, $company);
        }

        $company->update($payload);

        ActivityLogger::log('Company Updated', "Updated company: {$company->company_name} ({$company->company_code})", $company);

        return new CompanyResource($company->load(['companyType', 'companySize', 'contacts']));
    }

    /**
     * Process company logo upload, base64 data URI, or URL and return stored relative file path.
     */
    protected function handleLogo(Request $request, ?Company $company = null): ?string
    {
        // 1. Uploaded file (multipart/form-data)
        if ($request->hasFile('logo')) {
            if ($company?->logo && Storage::disk('public')->exists($company->logo)) {
                Storage::disk('public')->delete($company->logo);
            }

            return $request->file('logo')->store('company_logos', 'public');
        }

        // 2. Base64 data string (e.g. data:image/png;base64,...)
        $logoInput = $request->input('logo');
        if (is_string($logoInput) && preg_match('/^data:image\/(\w+);base64,/', $logoInput, $matches)) {
            $extension = strtolower($matches[1]);
            if ($extension === 'jpeg') {
                $extension = 'jpg';
            }

            $base64Data = substr($logoInput, strpos($logoInput, ',') + 1);
            $decoded = base64_decode($base64Data);

            if ($decoded !== false) {
                if ($company?->logo && Storage::disk('public')->exists($company->logo)) {
                    Storage::disk('public')->delete($company->logo);
                }

                $filename = 'company_logos/logo_'.uniqid().'_'.time().'.'.$extension;
                Storage::disk('public')->put($filename, $decoded);

                return $filename;
            }
        }

        // 3. Existing relative path or URL - keep as-is if provided
        if (is_string($logoInput) && ! empty($logoInput)) {
            if ($company && ($logoInput === $company->logo || str_ends_with($logoInput, $company->logo))) {
                return $company->logo;
            }

            return $logoInput;
        }

        // 4. Explicitly cleared / null
        if ($request->exists('logo') && empty($logoInput)) {
            if ($company?->logo && Storage::disk('public')->exists($company->logo)) {
                Storage::disk('public')->delete($company->logo);
            }

            return null;
        }

        return $company?->logo;
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
