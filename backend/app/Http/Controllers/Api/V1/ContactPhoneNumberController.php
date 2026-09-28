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

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        return response()->json(ContactPhoneNumberResource::collection($query->get()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'phone_number' => ['required', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'is_primary' => ['nullable', 'boolean'],
            'is_whatsapp' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        if (empty($validated['customer_id']) && empty($validated['contact_id'])) {
            return response()->json(['message' => 'Either customer_id or contact_id must be provided.'], 422);
        }

        // If marked primary, reset other primary flags
        if (!empty($validated['is_primary'])) {
            if (!empty($validated['customer_id'])) {
                ContactPhoneNumber::where('customer_id', $validated['customer_id'])->update(['is_primary' => false]);
            }
            if (!empty($validated['contact_id'])) {
                ContactPhoneNumber::where('contact_id', $validated['contact_id'])->update(['is_primary' => false]);
            }
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
            'phone_number' => ['sometimes', 'required', 'string', 'max:50'],
            'type' => ['nullable', 'string', 'max:50'],
            'is_primary' => ['nullable', 'boolean'],
            'is_whatsapp' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        if (!empty($validated['is_primary'])) {
            if ($contactPhoneNumber->customer_id) {
                ContactPhoneNumber::where('customer_id', $contactPhoneNumber->customer_id)
                    ->where('id', '!=', $contactPhoneNumber->id)
                    ->update(['is_primary' => false]);
            }
            if ($contactPhoneNumber->contact_id) {
                ContactPhoneNumber::where('contact_id', $contactPhoneNumber->contact_id)
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
