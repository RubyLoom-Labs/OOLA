<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\ContactPhoneNumber;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Customer::with(['contacts.phoneNumbers', 'primaryContact', 'phoneNumbers', 'primaryPhoneNumber'])
            ->withCount(['leads', 'projects', 'quotations', 'payments']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('customer_code', 'like', "%{$search}%")
                    ->orWhereHas('phoneNumbers', function ($pq) use ($search) {
                        $pq->where('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function createCustomer(array $data): Customer
    {
        return DB::transaction(function () use ($data) {
            // Enforce customer_code is always generated sequentially as CUS000001 format
            unset($data['customer_code']);
            $data['customer_code'] = Customer::generateCustomerCode();

            $phoneNumbers = $data['phone_numbers'] ?? [];
            unset($data['phone_numbers']);

            $customer = Customer::create($data);

            if (! empty($phoneNumbers)) {
                $this->syncPhoneNumbers($customer, $phoneNumbers);
            }

            ActivityLogger::log('Customer Created', "Created customer: {$customer->company_name}", $customer);

            return $customer->load(['contacts', 'phoneNumbers', 'primaryPhoneNumber']);
        });
    }

    public function updateCustomer(Customer $customer, array $data): Customer
    {
        return DB::transaction(function () use ($customer, $data) {
            unset($data['customer_code']); // Prevent updating customer code
            $phoneNumbers = null;
            if (array_key_exists('phone_numbers', $data)) {
                $phoneNumbers = $data['phone_numbers'];
                unset($data['phone_numbers']);
            }

            $customer->update($data);

            if ($phoneNumbers !== null) {
                $this->syncPhoneNumbers($customer, $phoneNumbers);
            }

            ActivityLogger::log('Customer Updated', "Updated customer: {$customer->company_name}", $customer);

            return $customer->load(['contacts', 'phoneNumbers', 'primaryPhoneNumber']);
        });
    }

    public function syncPhoneNumbers(Customer $customer, array $phoneNumbers): void
    {
        $contact = $customer->contacts()->first();
        if (! $contact) {
            $contact = Contact::create([
                'company_id' => $customer->id,
                'company' => $customer->company_name,
                'first_name' => 'Primary',
                'last_name' => 'Contact',
                'email' => $customer->email,
            ]);
        }

        $existingIds = [];
        $hasPrimary = false;

        foreach ($phoneNumbers as $idx => $item) {
            $phoneNumber = is_array($item) ? ($item['phone_number'] ?? null) : $item;
            if (empty($phoneNumber)) {
                continue;
            }

            $type = is_array($item) ? ($item['type'] ?? 'Mobile') : 'Mobile';
            $isPrimary = is_array($item) ? (bool) ($item['is_primary'] ?? ($idx === 0)) : ($idx === 0);
            $isWhatsapp = is_array($item) ? (bool) ($item['is_whatsapp'] ?? false) : false;
            $notes = is_array($item) ? ($item['notes'] ?? null) : null;
            $id = is_array($item) ? ($item['id'] ?? null) : null;

            if ($isPrimary && ! $hasPrimary) {
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
        if ($primary && $customer->phone !== $primary->phone_number) {
            $customer->phone = $primary->phone_number;
            $customer->saveQuietly();
        }
    }

    public function deleteCustomer(Customer $customer): bool
    {
        ActivityLogger::log('Customer Deleted', "Logically deleted customer: {$customer->company_name}", $customer);

        return $customer->logicalDelete();
    }
}
