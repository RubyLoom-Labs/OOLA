<?php

namespace App\Actions\Quotation;

use App\Models\ActivityLog;
use App\Models\Quotation;
use App\Models\QuotationItem;

class CreateQuotationAction
{
    public function execute(array $data): Quotation
    {
        $quotationNumber = 'QUO-'.date('Y').'-'.rand(1000, 9999);
        $data['quotation_number'] = $data['quotation_number'] ?? $quotationNumber;

        $itemsData = $data['items'] ?? [];
        unset($data['items']);

        $quotation = Quotation::create($data);

        $subtotal = 0;
        $order = 1;

        foreach ($itemsData as $item) {
            $qty = (float) ($item['quantity'] ?? 1);
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $discount = (float) ($item['discount'] ?? 0);
            $taxRate = (float) ($item['tax_rate'] ?? 0);

            $itemTotal = ($qty * $unitPrice) - $discount;
            $subtotal += $itemTotal;

            QuotationItem::create([
                'quotation_id' => $quotation->id,
                'item_name' => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'discount' => $discount,
                'tax_rate' => $taxRate,
                'total' => $itemTotal,
                'order_column' => $order++,
            ]);
        }

        $quotation->subtotal = $subtotal;
        if (($quotation->discount_type ?? 'percentage') === 'percentage') {
            $quotation->discount_amount = ($subtotal * ($quotation->discount_value ?? 0)) / 100;
        } else {
            $quotation->discount_amount = min($subtotal, (float) ($quotation->discount_value ?? 0));
        }

        $taxable = max(0, $subtotal - $quotation->discount_amount);
        $quotation->tax_amount = ($taxable * ($quotation->tax_rate ?? 0)) / 100;
        $quotation->total_amount = $taxable + $quotation->tax_amount;
        $quotation->save();

        ActivityLog::log(
            action: 'Quotation Created',
            description: "Quotation #{$quotation->quotation_number} generated for total {$quotation->currency} ".number_format($quotation->total_amount, 2),
            subject: $quotation
        );

        return $quotation->load(['customer', 'items', 'template']);
    }
}
