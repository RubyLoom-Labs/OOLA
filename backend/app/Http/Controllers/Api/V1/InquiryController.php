<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inquiry\StoreInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Models\Inquiry;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    /**
     * Display a paginated listing of website inquiries with search and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inquiry::query();

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
     * Store a newly submitted inquiry from the company website (public endpoint).
     */
    public function store(StoreInquiryRequest $request): JsonResponse
    {
        $payload = $request->validated();

        $inquiry = Inquiry::create($payload);

        try {
            ActivityLogger::log(
                'Website Inquiry Received',
                "New website inquiry from {$inquiry->first_name} {$inquiry->last_name} ({$inquiry->email})",
                $inquiry
            );
        } catch (\Throwable) {
            // Ignore activity logging errors for unauthenticated public submissions
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
}
