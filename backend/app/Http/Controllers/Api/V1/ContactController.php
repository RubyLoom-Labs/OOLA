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
        $query = Contact::with(['phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name']);

        // Safe filtering by company_id / customer_id
        if ($request->filled('company_id')) {
            $query->where('company_id', (int) $request->input('company_id'));
        } elseif ($request->filled('customer_id')) {
            $query->where('company_id', (int) $request->input('customer_id'));
        }

        // Safe filtering by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
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
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('website', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('phoneNumbers', function ($pq) use ($search) {
                      $pq->where('phone_number', 'like', "%{$search}%");
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
            'phone',
            'website',
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
                    'customer_id' => $contact->company_id,
                    'contact_id' => $contact->id,
                    'phone_number' => $contact->phone,
                    'type' => 'Mobile',
                    'is_primary' => true,
                    'is_whatsapp' => true,
                ]);
            }

            ActivityLogger::log('Contact Created', "Created contact: {$contact->full_name}", $contact);

            return (new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name'])))
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

            return new ContactResource($contact->load(['phoneNumbers', 'primaryPhoneNumber', 'company:id,company_name']));
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
            'company' => $contact->company,
            'company_name' => $contact->company,
            'full_name' => $contact->full_name,
            'projects_count' => $contact->projects_count,
            'projects' => $contact->projects_history,
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
                'customer_id' => $contact->company_id,
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
            $contact->saveQuietly();
        }
    }

    /**
     * Normalize aliases and map friendly fields.
     */
    protected function normalizeContactData(array $data): array
    {
        // Support company_name -> company
        if (isset($data['company_name']) && !isset($data['company'])) {
            $data['company'] = $data['company_name'];
        }
        unset($data['company_name']);

        // Support customer_id -> company_id
        if (isset($data['customer_id']) && !isset($data['company_id'])) {
            $data['company_id'] = $data['customer_id'];
        }
        unset($data['customer_id']);

        return $data;
    }
}
