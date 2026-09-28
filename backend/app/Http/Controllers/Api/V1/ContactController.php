<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contact\StoreContactRequest;
use App\Http\Requests\Contact\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Models\ContactPhoneNumber;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactController extends Controller
{
    /**
     * List contacts with safe parameterized filtering, searching, and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contact::with(['phoneNumbers', 'primaryPhoneNumber', 'customer'])
            ->withCount('projects');

        // Safe filtering by customer_id
        if ($request->filled('customer_id')) {
            $query->where('customer_id', (int) $request->input('customer_id'));
        }

        // Safe filtering by company type
        if ($request->filled('company_type')) {
            $query->where('company_type', $request->input('company_type'));
        }

        // Safe filtering by state
        if ($request->filled('state')) {
            $query->where('state', $request->input('state'));
        }

        // Safe parameterized search against SQL injection
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('company_type', 'like', "%{$search}%")
                  ->orWhere('owner_name', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('owner_email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('owner_phone', 'like', "%{$search}%")
                  ->orWhere('state', 'like', "%{$search}%")
                  ->orWhere('website', 'like', "%{$search}%")
                  ->orWhereHas('phoneNumbers', function ($pq) use ($search) {
                      $pq->where('phone_number', 'like', "%{$search}%");
                  });
            });
        }

        // Whitelisted sorting columns to prevent SQL injection
        $allowedSortColumns = [
            'id',
            'company_name',
            'company_type',
            'owner_name',
            'first_name',
            'last_name',
            'designation',
            'email',
            'state',
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
     * Store a newly created contact.
     */
    public function store(StoreContactRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $payload = $this->normalizeContactData($validated);

        return DB::transaction(function () use ($payload) {
            $phoneNumbers = $payload['phone_numbers'] ?? [];
            unset($payload['phone_numbers']);

            $contact = Contact::create($payload);

            if (!empty($phoneNumbers)) {
                $this->syncPhoneNumbers($contact, $phoneNumbers);
            } elseif (!empty($contact->phone)) {
                ContactPhoneNumber::create([
                    'customer_id' => $contact->customer_id,
                    'contact_id' => $contact->id,
                    'phone_number' => $contact->phone,
                    'type' => 'Mobile',
                    'is_primary' => true,
                    'is_whatsapp' => true,
                ]);
            }

            ActivityLogger::log('Contact Created', "Created contact: {$contact->full_name}", $contact);

            return (new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber', 'customer'])))
                ->response()
                ->setStatusCode(201);
        });
    }

    /**
     * Display the specified contact.
     */
    public function show(Contact $contact): ContactResource
    {
        return new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber', 'customer', 'directProjects.stage']));
    }

    /**
     * Update the specified contact.
     */
    public function update(UpdateContactRequest $request, Contact $contact): ContactResource
    {
        $validated = $request->validated();
        $payload = $this->normalizeContactData($validated);

        return DB::transaction(function () use ($contact, $payload) {
            $phoneNumbers = null;
            if (array_key_exists('phone_numbers', $payload)) {
                $phoneNumbers = $payload['phone_numbers'];
                unset($payload['phone_numbers']);
            }

            $contact->update($payload);

            if ($phoneNumbers !== null) {
                $this->syncPhoneNumbers($contact, $phoneNumbers);
            }

            ActivityLogger::log('Contact Updated', "Updated contact: {$contact->full_name}", $contact);

            return new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber', 'customer']));
        });
    }

    /**
     * Remove the specified contact (logical delete).
     */
    public function destroy(Contact $contact): JsonResponse
    {
        $contact->logicalDelete();
        ActivityLogger::log('Contact Deleted', "Deleted contact: {$contact->full_name}", $contact);
        return response()->json(['message' => 'Contact removed successfully (logical delete).']);
    }

    /**
     * Restore a logically deleted contact.
     */
    public function restore(int $id): JsonResponse
    {
        $contact = Contact::withoutGlobalScopes()->where('is_delete', true)->findOrFail($id);
        $contact->restore();
        ActivityLogger::log('Contact Restored', "Restored contact: {$contact->full_name}", $contact);
        return response()->json([
            'message' => 'Contact restored successfully.',
            'data' => new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber'])),
        ]);
    }

    /**
     * Fetch project count and history for a contact.
     */
    public function projectsHistory(Contact $contact): JsonResponse
    {
        return response()->json([
            'contact_id' => $contact->id,
            'company_name' => $contact->company_name,
            'owner_name' => $contact->owner_name ?? $contact->full_name,
            'projects_count' => $contact->projects_count,
            'projects' => $contact->projects_history,
        ]);
    }

    /**
     * Add an owner to a contact's owners list.
     */
    public function addOwner(Request $request, Contact $contact): JsonResponse
    {
        $validated = $request->validate([
            'owner' => ['required'],
            'owner.name' => ['nullable', 'string', 'max:255'],
            'owner.email' => ['nullable', 'email', 'max:255'],
            'owner.phone' => ['nullable', 'string', 'max:50'],
            'owner.designation' => ['nullable', 'string', 'max:100'],
            'owner.residence' => ['nullable', 'string', 'max:255'],
        ]);

        $ownerData = $validated['owner'];
        $contact->addOwner($ownerData);

        ActivityLogger::log('Contact Owner Added', "Added owner to contact: {$contact->full_name}", $contact);

        return response()->json([
            'message' => 'Owner added successfully.',
            'data' => new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber'])),
        ]);
    }

    /**
     * Synchronize phone numbers safely.
     */
    protected function syncPhoneNumbers(Contact $contact, array $phoneNumbers): void
    {
        $existingIds = [];
        $hasPrimary = false;

        foreach ($phoneNumbers as $idx => $item) {
            $phoneNumber = is_array($item) ? ($item['phone_number'] ?? null) : $item;
            if (empty($phoneNumber)) {
                continue;
            }

            $type = is_array($item) ? ($item['type'] ?? 'Mobile') : 'Mobile';
            $isPrimary = is_array($item) ? (bool)($item['is_primary'] ?? ($idx === 0)) : ($idx === 0);
            $isWhatsapp = is_array($item) ? (bool)($item['is_whatsapp'] ?? false) : false;
            $notes = is_array($item) ? ($item['notes'] ?? null) : null;
            $id = is_array($item) ? ($item['id'] ?? null) : null;

            if ($isPrimary && !$hasPrimary) {
                $hasPrimary = true;
            } elseif ($isPrimary && $hasPrimary) {
                $isPrimary = false;
            }

            if ($id) {
                $record = ContactPhoneNumber::where('id', $id)->where('contact_id', $contact->id)->first();
                if ($record) {
                    $record->update([
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
                'customer_id' => $contact->customer_id,
                'contact_id' => $contact->id,
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
            ]);

        $primary = ContactPhoneNumber::where('contact_id', $contact->id)->where('is_primary', true)->first();
        if ($primary && $contact->phone !== $primary->phone_number) {
            $contact->phone = $primary->phone_number;
            $contact->owner_phone = $primary->phone_number;
            $contact->saveQuietly();
        }
    }

    /**
     * Normalize aliases and map friendly fields.
     */
    protected function normalizeContactData(array $data): array
    {
        // Website alias
        if (isset($data['web']) && !isset($data['website'])) {
            $data['website'] = $data['web'];
        }
        unset($data['web']);

        // Company address alias
        if (isset($data['address']) && !isset($data['company_address'])) {
            $data['company_address'] = $data['address'];
        }
        unset($data['address']);

        // State alias
        if (isset($data['states']) && !isset($data['state'])) {
            $data['state'] = $data['states'];
        }
        unset($data['states']);

        // Owner residence alias
        if (isset($data['residence']) && !isset($data['owner_residence'])) {
            $data['owner_residence'] = $data['residence'];
        }
        unset($data['residence']);

        // Owner birthday alias
        if (isset($data['birthday']) && !isset($data['owner_birthday'])) {
            $data['owner_birthday'] = $data['birthday'];
        }
        unset($data['birthday']);

        // Sync owner_email and email
        if (isset($data['owner_email']) && !isset($data['email'])) {
            $data['email'] = $data['owner_email'];
        } elseif (isset($data['email']) && !isset($data['owner_email'])) {
            $data['owner_email'] = $data['email'];
        }

        // Sync owner_phone and phone
        if (isset($data['owner_phone']) && !isset($data['phone'])) {
            $data['phone'] = $data['owner_phone'];
        } elseif (isset($data['phone']) && !isset($data['owner_phone'])) {
            $data['owner_phone'] = $data['phone'];
        }

        // Sync owner_name and first_name/last_name
        if (!empty($data['owner_name']) && empty($data['first_name'])) {
            $parts = explode(' ', trim($data['owner_name']), 2);
            $data['first_name'] = $parts[0] ?? $data['owner_name'];
            if (isset($parts[1]) && empty($data['last_name'])) {
                $data['last_name'] = $parts[1];
            }
        } elseif (empty($data['owner_name']) && !empty($data['first_name'])) {
            $data['owner_name'] = trim("{$data['first_name']} " . ($data['last_name'] ?? ''));
        }

        return $data;
    }
}
