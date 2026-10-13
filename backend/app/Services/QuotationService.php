<?php

namespace App\Services;

use App\Models\Quotation;
use App\Models\QuotationItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class QuotationService
{
    public function getList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Quotation::with(['customer', 'project', 'lead', 'template', 'items']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('quotation_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function createQuotation(array $data, array $items = []): Quotation
    {
        return DB::transaction(function () use ($data, $items) {
            if (empty($data['quotation_number'])) {
                $data['quotation_number'] = 'QUO-'.date('Y').'-'.strtoupper(substr(uniqid(), -4));
            }

            // Calculate totals
            $totals = $this->calculateTotals($items, $data['discount_type'] ?? 'percentage', $data['discount_value'] ?? 0, $data['tax_rate'] ?? 0);
            $data = array_merge($data, $totals);

            $quotation = Quotation::create($data);

            foreach ($items as $index => $itemData) {
                $itemTotal = ($itemData['quantity'] ?? 1) * ($itemData['unit_price'] ?? 0);
                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'item_name' => $itemData['item_name'],
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'] ?? 1,
                    'unit_price' => $itemData['unit_price'] ?? 0,
                    'discount' => $itemData['discount'] ?? 0,
                    'tax_rate' => $itemData['tax_rate'] ?? 0,
                    'total' => $itemTotal,
                    'order_column' => $index + 1,
                ]);
            }

            ActivityLogger::log('Quotation Created', "Created quotation: {$quotation->quotation_number}", $quotation);

            return $quotation->load('items');
        });
    }

    public function updateQuotation(Quotation $quotation, array $data, ?array $items = null): Quotation
    {
        return DB::transaction(function () use ($quotation, $data, $items) {
            if ($items !== null) {
                $totals = $this->calculateTotals(
                    $items,
                    $data['discount_type'] ?? $quotation->discount_type,
                    $data['discount_value'] ?? $quotation->discount_value,
                    $data['tax_rate'] ?? $quotation->tax_rate
                );
                $data = array_merge($data, $totals);

                $quotation->items()->delete();
                foreach ($items as $index => $itemData) {
                    $itemTotal = ($itemData['quantity'] ?? 1) * ($itemData['unit_price'] ?? 0);
                    QuotationItem::create([
                        'quotation_id' => $quotation->id,
                        'item_name' => $itemData['item_name'],
                        'description' => $itemData['description'] ?? null,
                        'quantity' => $itemData['quantity'] ?? 1,
                        'unit_price' => $itemData['unit_price'] ?? 0,
                        'discount' => $itemData['discount'] ?? 0,
                        'tax_rate' => $itemData['tax_rate'] ?? 0,
                        'total' => $itemTotal,
                        'order_column' => $index + 1,
                    ]);
                }
            }

            $quotation->update($data);

            ActivityLogger::log('Quotation Updated', "Updated quotation: {$quotation->quotation_number}", $quotation);

            return $quotation->load('items');
        });
    }

    protected function calculateTotals(array $items, string $discountType, float $discountValue, float $taxRate): array
    {
        $subtotal = 0;
        foreach ($items as $item) {
            $qty = (float) ($item['quantity'] ?? 1);
            $price = (float) ($item['unit_price'] ?? 0);
            $subtotal += ($qty * $price);
        }

        $discountAmount = 0;
        if ($discountType === 'percentage') {
            $discountAmount = ($subtotal * ($discountValue / 100));
        } else {
            $discountAmount = $discountValue;
        }

        $afterDiscount = max(0, $subtotal - $discountAmount);
        $taxAmount = ($afterDiscount * ($taxRate / 100));
        $totalAmount = $afterDiscount + $taxAmount;

        return [
            'subtotal' => $subtotal,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'discount_amount' => $discountAmount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
        ];
    }
}
