<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contact\StoreContactRequest;
use App\Http\Requests\Contact\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Models\ContactPhoneNumber;
use App\Models\ContactSite;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ContactController extends Controller
{
    /**
     * List contacts with safe parameterized filtering, searching, and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contact::with(['sites', 'phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name']);

        // Safe filtering by company_id / customer_id
        if ($request->filled('company_id')) {
            $query->where('company_id', (int) $request->input('company_id'));
        } elseif ($request->filled('customer_id')) {
            $query->where('company_id', (int) $request->input('customer_id'));
        }

        // Safe filtering by status (boolean 1/0, true/false, 'Active' string fallback)
        if ($request->has('status') && $request->input('status') !== null && $request->input('status') !== '') {
            $rawStatus = $request->input('status');
            if (is_numeric($rawStatus)) {
                $query->where('status', (int) $rawStatus === 1);
            } else {
                $statusVal = filter_var($rawStatus, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($statusVal !== null) {
                    $query->where('status', $statusVal);
                } else {
                    $query->where('status', strtolower($rawStatus) === 'active');
                }
            }
        }

        // Safe parameterized search against SQL injection
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('company', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhereHas('phoneNumbers', function ($pq) use ($search) {
                        $pq->where('phone_number', 'like', "%{$search}%")
                            ->orWhere('country_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('sites', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('url', 'like', "%{$search}%");
                    });
            });
        }

        // Whitelisted sorting columns to prevent SQL injection
        $allowedSortColumns = [
            'id',
            'company',
            'first_name',
            'last_name',
            'designation',
            'email',
            'birthday',
            'status',
            'created_at',
            'updated_at',
        ];

        $sortBy = in_array($request->input('sort_by'), $allowedSortColumns, true)
            ? $request->input('sort_by')
            : 'created_at';

        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage > 0) {
            $contacts = $query->paginate($perPage);

            return response()->json([
                'data' => ContactResource::collection($contacts),
                'meta' => [
                    'current_page' => $contacts->currentPage(),
                    'last_page' => $contacts->lastPage(),
                    'per_page' => $contacts->perPage(),
                    'total' => $contacts->total(),
                ],
            ]);
        }

        return response()->json(ContactResource::collection($query->get()));
    }

    /**
     * Retrieve active contacts (status = 1 and is_delete = 0) id and names by company ID.
     */
    public function byCompany(Request $request, int $companyId): JsonResponse
    {
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
     * Store a newly created contact.
     */
    public function store(StoreContactRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $payload = $this->normalizeContactData($validated);

        if ($request->hasFile('avatar') || $request->filled('avatar')) {
            $avatarPath = $this->handleAvatar($request);
            if ($avatarPath !== null) {
                $payload['avatar'] = $avatarPath;
            }
        } else {
            unset($payload['avatar']);
        }

        return DB::transaction(function () use ($payload) {
            $phoneNumbers = $payload['phone_numbers'] ?? [];
            unset($payload['phone_numbers']);

            $sites = $payload['sites'] ?? [];
            unset($payload['sites']);

            $contact = Contact::create($payload);

            if (! empty($sites)) {
                $this->syncSites($contact, $sites);
            }

            if (! empty($phoneNumbers)) {
                $this->syncPhoneNumbers($contact, $phoneNumbers);
            }

            ActivityLogger::log('Contact Created', "Created contact: {$contact->full_name}", $contact);

            return (new ContactResource($contact->load(['sites', 'phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name'])))
                ->response()
                ->setStatusCode(201);
        });
    }

    /**
     * Display the specified contact with company details and projects history.
     */
    public function show(Contact $contact): ContactResource
    {
        return new ContactResource(
            $contact->load([
                'sites',
                'phoneNumbers',
                'primaryPhoneNumber',
                'company.companyType',
                'company.companySize',
                'directProjects.stage',
            ])
        );
    }

    /**
     * Update the specified contact.
     */
    public function update(UpdateContactRequest $request, Contact $contact): ContactResource
    {
        $validated = $request->validated();
        $payload = $this->normalizeContactData($validated);

        if ($request->hasFile('avatar') || $request->filled('avatar') || $request->exists('avatar')) {
            $avatarPath = $this->handleAvatar($request, $contact);
            $payload['avatar'] = $avatarPath;
        } else {
            unset($payload['avatar']);
        }

        return DB::transaction(function () use ($contact, $payload) {
            $phoneNumbers = null;
            if (array_key_exists('phone_numbers', $payload)) {
                $phoneNumbers = $payload['phone_numbers'];
                unset($payload['phone_numbers']);
            }

            $sites = null;
            if (array_key_exists('sites', $payload)) {
                $sites = $payload['sites'];
                unset($payload['sites']);
            }

            $contact->update($payload);

            if ($sites !== null) {
                $this->syncSites($contact, $sites);
            }

            if ($phoneNumbers !== null) {
                $this->syncPhoneNumbers($contact, $phoneNumbers);
            }

            ActivityLogger::log('Contact Updated', "Updated contact: {$contact->full_name}", $contact);

            return new ContactResource($contact->load(['sites', 'phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name']));
        });
    }

    /**
     * Remove the specified contact (logical delete).
     */
    public function destroy(Contact $contact): JsonResponse
    {
        DB::transaction(function () use ($contact) {
            $contact->logicalDelete();

            $deletedBy = Auth::id();

            ContactSite::where('contact_id', $contact->id)->update([
                'is_delete' => true,
                'deleted_at' => now(),
                'deleted_by' => $deletedBy,
            ]);

            ContactPhoneNumber::where('contact_id', $contact->id)->update([
                'is_delete' => true,
                'deleted_at' => now(),
                'deleted_by' => $deletedBy,
            ]);
        });

        ActivityLogger::log('Contact Deleted', "Deleted contact: {$contact->full_name}", $contact);

        return response()->json(['message' => 'Contact removed successfully (logical delete).']);
    }

    /**
     * Restore a logically deleted contact.
     */
    public function restore(int $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $contact = Contact::withoutGlobalScopes()->where('is_delete', true)->findOrFail($id);
            $contact->restore();

            ContactSite::withoutGlobalScopes()->where('contact_id', $contact->id)->update([
                'is_delete' => false,
                'deleted_at' => null,
                'deleted_by' => null,
            ]);

            ContactPhoneNumber::withoutGlobalScopes()->where('contact_id', $contact->id)->update([
                'is_delete' => false,
                'deleted_at' => null,
                'deleted_by' => null,
            ]);

            ActivityLogger::log('Contact Restored', "Restored contact: {$contact->full_name}", $contact);

            return response()->json([
                'message' => 'Contact restored successfully.',
                'data' => new ContactResource($contact->load(['sites', 'phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name'])),
            ]);
        });
    }

    /**
     * Fetch project count and history for a contact.
     */
    public function projectsHistory(Contact $contact): JsonResponse
    {
        return response()->json([
            'contact_id' => $contact->id,
            'company' => $contact->company,
            'company_name' => $contact->company,
            'full_name' => $contact->full_name,
            'projects_count' => $contact->projects_count,
            'projects' => $contact->projects_history,
        ]);
    }

    /**
     * Synchronize phone numbers safely and enforce single is_primary selection.
     */
    protected function syncPhoneNumbers(Contact $contact, array $phoneNumbers): void
    {
        $existingIds = [];
        $primaryIndex = null;

        // Find explicit primary item index if provided
        foreach ($phoneNumbers as $idx => $item) {
            if (is_array($item) && ! empty($item['is_primary'])) {
                $primaryIndex = $idx;
                break;
            }
        }

        // If no explicit primary was marked, default the first item as primary
        if ($primaryIndex === null && count($phoneNumbers) > 0) {
            $primaryIndex = 0;
        }

        foreach ($phoneNumbers as $idx => $item) {
            $phoneNumber = is_array($item) ? ($item['phone_number'] ?? null) : $item;
            if (empty($phoneNumber)) {
                continue;
            }

            $countryCode = is_array($item) ? ($item['country_code'] ?? null) : null;
            $type = is_array($item) ? ($item['type'] ?? 'Mobile') : 'Mobile';
            $isPrimary = ($idx === $primaryIndex);
            $isWhatsapp = is_array($item) ? (bool) ($item['is_whatsapp'] ?? false) : false;
            $notes = is_array($item) ? ($item['notes'] ?? null) : null;
            $id = is_array($item) ? ($item['id'] ?? null) : null;

            if ($id) {
                $record = ContactPhoneNumber::where('id', $id)->where('contact_id', $contact->id)->first();
                if ($record) {
                    $record->update([
                        'country_code' => $countryCode,
                        'phone_number' => $phoneNumber,
                        'type' => $type,
                        'is_primary' => $isPrimary,
                        'is_whatsapp' => $isWhatsapp,
                        'notes' => $notes,
                        'is_delete' => false,
                    ]);
                    $existingIds[] = $record->id;

                    continue;
                }
            }

            $record = ContactPhoneNumber::create([
                'contact_id' => $contact->id,
                'country_code' => $countryCode,
                'phone_number' => $phoneNumber,
                'type' => $type,
                'is_primary' => $isPrimary,
                'is_whatsapp' => $isWhatsapp,
                'notes' => $notes,
            ]);
            $existingIds[] = $record->id;
        }

        ContactPhoneNumber::where('contact_id', $contact->id)
            ->whereNotIn('id', $existingIds)
            ->update([
                'is_delete' => true,
                'deleted_at' => now(),
                'deleted_by' => Auth::id(),
            ]);
    }

    /**
     * Synchronize contact sites/websites safely.
     */
    protected function syncSites(Contact $contact, array $sites): void
    {
        $existingIds = [];

        foreach ($sites as $item) {
            if (! is_array($item)) {
                continue;
            }

            $name = $item['name'] ?? null;
            $url = $item['url'] ?? null;
            $status = isset($item['status']) ? (bool) $item['status'] : true;
            $isDelete = isset($item['is_delete']) ? (bool) $item['is_delete'] : false;
            $id = $item['id'] ?? null;

            if (empty($url) && empty($name) && ! $id) {
                continue;
            }

            if ($id) {
                $record = ContactSite::where('id', $id)->where('contact_id', $contact->id)->first();
                if ($record) {
                    $record->update([
                        'name' => $name,
                        'url' => $url,
                        'status' => $status,
                        'is_delete' => $isDelete,
                    ]);
                    $existingIds[] = $record->id;

                    continue;
                }
            }

            $record = ContactSite::create([
                'contact_id' => $contact->id,
                'name' => $name,
                'url' => $url,
                'status' => $status,
                'is_delete' => $isDelete,
            ]);
            $existingIds[] = $record->id;
        }

        ContactSite::where('contact_id', $contact->id)
            ->whereNotIn('id', $existingIds)
            ->update([
                'is_delete' => true,
                'deleted_at' => now(),
                'deleted_by' => Auth::id(),
            ]);
    }

    /**
     * Normalize aliases and map friendly fields.
     */
    protected function normalizeContactData(array $data): array
    {
        // Support company_name -> company
        if (isset($data['company_name']) && ! isset($data['company'])) {
            $data['company'] = $data['company_name'];
        }
        unset($data['company_name']);

        // Support customer_id -> company_id
        if (isset($data['customer_id']) && ! isset($data['company_id'])) {
            $data['company_id'] = $data['customer_id'];
        }
        unset($data['customer_id']);

        // Strip non-contact columns passed from frontend form payloads
        unset($data['notes']);

        // If phone is sent but phone_numbers is empty, map it
        if (! empty($data['phone']) && empty($data['phone_numbers'])) {
            $data['phone_numbers'] = [
                [
                    'phone_number' => $data['phone'],
                    'country_code' => $data['phone_country_code'] ?? null,
                    'is_primary' => true,
                ],
            ];
        }
        unset($data['phone'], $data['phone_country_code']);

        return $data;
    }

    /**
     * Process avatar upload or base64 data URI and return stored relative file path.
     */
    protected function handleAvatar(Request $request, ?Contact $contact = null): ?string
    {
        // 1. Uploaded file
        if ($request->hasFile('avatar')) {
            if ($contact?->avatar && Storage::disk('public')->exists($contact->avatar)) {
                Storage::disk('public')->delete($contact->avatar);
            }

            return $request->file('avatar')->store('contact_avatars', 'public');
        }

        // 2. Base64 data string (e.g. data:image/jpeg;base64,...)
        $avatarInput = $request->input('avatar');
        if (is_string($avatarInput) && preg_match('/^data:image\/(\w+);base64,/', $avatarInput, $matches)) {
            $extension = strtolower($matches[1]);
            if ($extension === 'jpeg') {
                $extension = 'jpg';
            }

            $base64Data = substr($avatarInput, strpos($avatarInput, ',') + 1);
            $decoded = base64_decode($base64Data);

            if ($decoded !== false) {
                if ($contact?->avatar && Storage::disk('public')->exists($contact->avatar)) {
                    Storage::disk('public')->delete($contact->avatar);
                }

                $filename = 'contact_avatars/avatar_'.uniqid().'_'.time().'.'.$extension;
                Storage::disk('public')->put($filename, $decoded);

                return $filename;
            }
        }

        // 3. Existing relative path or URL - keep as-is if provided
        if (is_string($avatarInput) && ! empty($avatarInput)) {
            if ($contact && ($avatarInput === $contact->avatar || str_ends_with($avatarInput, $contact->avatar))) {
                return $contact->avatar;
            }

            return $avatarInput;
        }

        // 4. Explicitly cleared / null
        if ($request->exists('avatar') && empty($avatarInput)) {
            if ($contact?->avatar && Storage::disk('public')->exists($contact->avatar)) {
                Storage::disk('public')->delete($contact->avatar);
            }

            return null;
        }

        return $contact?->avatar;
    }
}
