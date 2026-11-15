<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inquiry\StoreInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Http\Resources\LeadResource;
use App\Models\Inquiry;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStage;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InquiryController extends Controller
{
    /**
     * Display a paginated listing of active website inquiries (status = 1 and is_delete = 0).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inquiry::where('status', true)
            ->where('is_delete', false);

        // Safe parameterized search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");

                $parts = preg_split('/\s+/', $search);
                if (count($parts) >= 2) {
                    $q->orWhere(function ($sub) use ($parts) {
                        $sub->where('first_name', 'like', "%{$parts[0]}%")
                            ->where('last_name', 'like', "%{$parts[1]}%");
                    });
                }
            });
        }

        $allowedSortColumns = [
            'id',
            'first_name',
            'last_name',
            'email',
            'contact_number',
            'subject',
            'created_at',
            'updated_at',
        ];

        $sortBy = in_array($request->input('sort_by'), $allowedSortColumns, true)
            ? $request->input('sort_by')
            : 'created_at';

        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir)->orderBy('id', 'desc');

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage > 0) {
            $inquiries = $query->paginate($perPage);

            return response()->json([
                'data' => InquiryResource::collection($inquiries),
                'meta' => [
                    'current_page' => $inquiries->currentPage(),
                    'last_page' => $inquiries->lastPage(),
                    'per_page' => $inquiries->perPage(),
                    'total' => $inquiries->total(),
                ],
            ]);
        }

        $all = $query->get();

        return response()->json([
            'data' => InquiryResource::collection($all),
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $all->count(),
                'total' => $all->count(),
            ],
        ]);
    }

    /**
     * Store a newly submitted inquiry from the company website.
     */
    public function store(StoreInquiryRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['status'] = true;
        $payload['is_delete'] = false;

        $inquiry = Inquiry::create($payload);

        try {
            ActivityLogger::log(
                'Website Inquiry Received',
                "New website inquiry from {$inquiry->first_name} {$inquiry->last_name} ({$inquiry->email})",
                $inquiry
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Inquiry submitted successfully.',
            'data' => new InquiryResource($inquiry),
        ], 201);
    }

    /**
     * Display the specified website inquiry.
     */
    public function show(int $id): JsonResponse
    {
        $inquiry = Inquiry::findOrFail($id);

        return response()->json([
            'data' => new InquiryResource($inquiry),
        ]);
    }

    /**
     * Convert an inquiry into a Lead record in the database and mark inquiry status = 0.
     */
    public function convertToLead(int $id): JsonResponse
    {
        $inquiry = Inquiry::where('is_delete', false)->findOrFail($id);

        $lead = DB::transaction(function () use ($inquiry) {
            // 1. Mark inquiry status = 0 (converted to lead, no longer shown in Inquiry tab)
            $inquiry->status = false;
            $inquiry->save();

            // 2. Resolve default Lead Stage ('New') and Lead Source ('Website Inbound')
            $newStage = LeadStage::where('slug', 'new')->first()
                ?? LeadStage::orderBy('order_column', 'asc')->first();

            $websiteSource = LeadSource::where('slug', 'website')->first()
                ?? LeadSource::first();

            $fullName = trim("{$inquiry->first_name} {$inquiry->last_name}");
            $leadTitle = ! empty($inquiry->subject)
                ? $inquiry->subject
                : "Website Inquiry - {$fullName}";

            $leadCode = 'LEAD-'.date('Y').'-'.strtoupper(substr(uniqid(), -5));

            // 3. Create Lead record in leads table with all inquiry details
            return Lead::create([
                'inquiry_id' => $inquiry->id,
                'lead_code' => $leadCode,
                'lead_title' => $leadTitle,
                'requirement_name' => $inquiry->subject ?: "Inquiry from {$fullName}",
                'requirement_details' => $inquiry->message,
                'first_name' => $inquiry->first_name,
                'last_name' => $inquiry->last_name,
                'email' => $inquiry->email,
                'contact_number' => $inquiry->contact_number,
                'subject' => $inquiry->subject,
                'message' => $inquiry->message,
                'lead_source_id' => $websiteSource?->id,
                'lead_stage_id' => $newStage?->id,
                'budget_quoted' => 0,
                'currency' => 'LKR',
                'priority' => 'Medium',
                'status' => 'Active',
                'next_step' => 'Follow up with '.$fullName,
            ]);
        });

        try {
            ActivityLogger::log(
                'Inquiry Converted to Lead',
                "Converted inquiry #{$inquiry->id} ({$inquiry->first_name} {$inquiry->last_name}) to Lead {$lead->lead_code}",
                $lead
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Inquiry converted to lead successfully.',
            'data' => [
                'inquiry' => new InquiryResource($inquiry),
                'lead' => new LeadResource($lead->load(['stage', 'source'])),
            ],
        ]);
    }

    /**
     * Logically delete an inquiry (sets is_delete = 1).
     */
    public function destroy(int $id): JsonResponse
    {
        $inquiry = Inquiry::findOrFail($id);
        $inquiry->logicalDelete();

        try {
            ActivityLogger::log(
                'Website Inquiry Deleted',
                "Deleted website inquiry #{$inquiry->id} from {$inquiry->first_name} {$inquiry->last_name}",
                $inquiry
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Inquiry deleted successfully.',
        ]);
    }
}
