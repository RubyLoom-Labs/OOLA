<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $payments = $this->service->getList($request->all(), (int)$request->get('per_page', 15));
        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $payment = $this->service->createPayment($request->validated());
        return (new PaymentResource($payment->load(['customer', 'project'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Payment $payment): PaymentResource
    {
        return new PaymentResource($payment->load(['customer', 'project', 'quotation']));
    }

    public function update(Request $request, Payment $payment): PaymentResource
    {
        $payment = $this->service->updatePayment($payment, $request->all());
        return new PaymentResource($payment->load(['customer', 'project']));
    }

    public function projectLedger(int $projectId): JsonResponse
    {
        $ledger = $this->service->getProjectLedger($projectId);
        return response()->json($ledger);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->logicalDelete();
        return response()->json(['message' => 'Payment record archived successfully.']);
    }
}
