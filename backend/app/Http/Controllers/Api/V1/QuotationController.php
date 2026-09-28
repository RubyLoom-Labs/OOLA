<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotation\StoreQuotationRequest;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuotationController extends Controller
{
    public function __construct(protected QuotationService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $quotations = $this->service->getList($request->all(), (int)$request->get('per_page', 15));
        return QuotationResource::collection($quotations);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        $quotation = $this->service->createQuotation(
            $request->validated(),
            $request->input('items', [])
        );
        return (new QuotationResource($quotation->load(['customer', 'items'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Quotation $quotation): QuotationResource
    {
        return new QuotationResource($quotation->load(['customer', 'project', 'lead', 'template', 'items']));
    }

    public function update(Request $request, Quotation $quotation): QuotationResource
    {
        $quotation = $this->service->updateQuotation(
            $quotation,
            $request->except(['items']),
            $request->input('items')
        );
        return new QuotationResource($quotation->load(['customer', 'items']));
    }

    public function approve(Quotation $quotation): JsonResponse
    {
        $quotation->update(['status' => 'Approved']);
        return response()->json(['message' => 'Quotation approved successfully.', 'quotation' => new QuotationResource($quotation)]);
    }

    public function reject(Quotation $quotation): JsonResponse
    {
        $quotation->update(['status' => 'Rejected']);
        return response()->json(['message' => 'Quotation rejected.', 'quotation' => new QuotationResource($quotation)]);
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        $quotation->logicalDelete();
        return response()->json(['message' => 'Quotation archived successfully.']);
    }
}
