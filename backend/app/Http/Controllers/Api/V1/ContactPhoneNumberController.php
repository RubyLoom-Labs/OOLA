<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactPhoneNumberResource;
use App\Models\ContactPhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactPhoneNumberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ContactPhoneNumber::query();

        if ($request->has('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        return response()->json(ContactPhoneNumberResource::collection($query->get()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contact_id' => ['required', 'exists:contacts,id'],
            'country_code' => ['nullable', 'string', 'max:20'],
            'phone_number' => ['required', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'is_primary' => ['nullable', 'boolean'],
            'is_whatsapp' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        // If marked primary, demote other primary flags for this contact
        if (! empty($validated['is_primary'])) {
            ContactPhoneNumber::where('contact_id', $validated['contact_id'])->update(['is_primary' => false]);
        }

        $phone = ContactPhoneNumber::create($validated);

        return (new ContactPhoneNumberResource($phone))->response()->setStatusCode(201);
    }

    public function show(ContactPhoneNumber $contactPhoneNumber): ContactPhoneNumberResource
    {
        return new ContactPhoneNumberResource($contactPhoneNumber);
    }

    public function update(Request $request, ContactPhoneNumber $contactPhoneNumber): ContactPhoneNumberResource
    {
        $validated = $request->validate([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'country_code' => ['nullable', 'string', 'max:20'],
            'phone_number' => ['sometimes', 'required', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'is_primary' => ['nullable', 'boolean'],
            'is_whatsapp' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('is_primary', $validated) && $validated['is_primary']) {
            $contactId = $validated['contact_id'] ?? $contactPhoneNumber->contact_id;
            if ($contactId) {
                ContactPhoneNumber::where('contact_id', $contactId)
                    ->where('id', '!=', $contactPhoneNumber->id)
                    ->update(['is_primary' => false]);
            }
        }

        $contactPhoneNumber->update($validated);

        return new ContactPhoneNumberResource($contactPhoneNumber);
    }

    public function destroy(ContactPhoneNumber $contactPhoneNumber): JsonResponse
    {
        $contactPhoneNumber->logicalDelete();

        return response()->json(['message' => 'Phone number removed successfully.']);
    }
}
