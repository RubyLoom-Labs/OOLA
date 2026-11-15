<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CommentController extends Controller
{
    /**
     * Normalize raw approval status into boolean:
     * false (0) = Pending, true (1) = Approved
     */
    protected function normalizeStatus(mixed $status): bool
    {
        if (is_bool($status)) {
            return $status;
        }
        if (is_numeric($status)) {
            return (int) $status === 1;
        }
        $clean = strtolower(trim((string) $status));

        return in_array($clean, ['1', 'true', 'approved', 'approve', 'yes'], true);
    }

    /**
     * Normalize raw home page display status into boolean:
     * false (0) = Not Display, true (1) = Display
     */
    protected function normalizeDisplayStatus(mixed $displayStatus): bool
    {
        if (is_bool($displayStatus)) {
            return $displayStatus;
        }
        if (is_numeric($displayStatus)) {
            return (int) $displayStatus === 1;
        }
        $clean = strtolower(trim((string) $displayStatus));

        return in_array($clean, ['1', 'true', 'display', 'show', 'yes'], true);
    }

    /**
     * Process comment image upload, base64 data URI, or URL and return stored relative file path.
     */
    protected function handleImage(Request $request, ?Comment $comment = null): ?string
    {
        // 1. Uploaded file (multipart/form-data)
        if ($request->hasFile('image')) {
            if ($comment?->image && Storage::disk('public')->exists($comment->image)) {
                Storage::disk('public')->delete($comment->image);
            }

            return $request->file('image')->store('comment_images', 'public');
        }

        // 2. Base64 data string (e.g. data:image/png;base64,...)
        $imageInput = $request->input('image');
        if (is_string($imageInput) && preg_match('/^data:image\/(\w+);base64,/', $imageInput, $matches)) {
            $extension = strtolower($matches[1]);
            if ($extension === 'jpeg') {
                $extension = 'jpg';
            }

            $base64Data = substr($imageInput, strpos($imageInput, ',') + 1);
            $decoded = base64_decode($base64Data);

            if ($decoded !== false) {
                if ($comment?->image && Storage::disk('public')->exists($comment->image)) {
                    Storage::disk('public')->delete($comment->image);
                }

                $filename = 'comment_images/comment_'.uniqid().'_'.time().'.'.$extension;
                Storage::disk('public')->put($filename, $decoded);

                return $filename;
            }
        }

        // 3. Existing relative path or URL - keep as-is if provided
        if (is_string($imageInput) && ! empty($imageInput)) {
            if ($comment && ($imageInput === $comment->image || str_ends_with($imageInput, $comment->image))) {
                return $comment->image;
            }

            return $imageInput;
        }

        // 4. Explicitly cleared / null
        if ($request->exists('image') && empty($imageInput)) {
            if ($comment?->image && Storage::disk('public')->exists($comment->image)) {
                Storage::disk('public')->delete($comment->image);
            }

            return null;
        }

        return $comment?->image;
    }

    /**
     * Display a paginated listing of website comments (where is_delete = 0).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Comment::where('is_delete', false);

        // Filter by approval status or display_status if requested
        if ($request->filled('status') && strtolower((string) $request->input('status')) !== 'all') {
            $rawFilter = strtolower(trim((string) $request->input('status')));
            if (in_array($rawFilter, ['display', 'not display', 'not_display', 'not-display'], true)) {
                $query->where('display_status', $this->normalizeDisplayStatus($rawFilter));
            } else {
                $query->where('status', $this->normalizeStatus($rawFilter));
            }
        }

        if ($request->filled('display_status') && strtolower((string) $request->input('display_status')) !== 'all') {
            $query->where('display_status', $this->normalizeDisplayStatus($request->input('display_status')));
        }

        // Safe parameterized search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        $allowedSortColumns = [
            'id',
            'name',
            'company',
            'title',
            'status',
            'display_status',
            'created_at',
            'updated_at',
        ];

        $sortBy = in_array($request->input('sort_by'), $allowedSortColumns, true)
            ? $request->input('sort_by')
            : 'created_at';

        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir)->orderBy('id', 'desc');

        // Summary counts across all non-deleted comments (0 = Pending/Not Display, 1 = Approved/Display)
        $pendingCount = Comment::where('is_delete', false)->where('status', false)->count();
        $approvedCount = Comment::where('is_delete', false)->where('status', true)->count();
        $displayCount = Comment::where('is_delete', false)->where('display_status', true)->count();
        $notDisplayCount = Comment::where('is_delete', false)->where('display_status', false)->count();

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage > 0) {
            $comments = $query->paginate($perPage);

            return response()->json([
                'data' => CommentResource::collection($comments),
                'meta' => [
                    'current_page' => $comments->currentPage(),
                    'last_page' => $comments->lastPage(),
                    'per_page' => $comments->perPage(),
                    'total' => $comments->total(),
                    'pending_count' => $pendingCount,
                    'approved_count' => $approvedCount,
                    'display_count' => $displayCount,
                    'not_display_count' => $notDisplayCount,
                ],
            ]);
        }

        $all = $query->get();

        return response()->json([
            'data' => CommentResource::collection($all),
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $all->count(),
                'total' => $all->count(),
                'pending_count' => $pendingCount,
                'approved_count' => $approvedCount,
                'display_count' => $displayCount,
                'not_display_count' => $notDisplayCount,
            ],
        ]);
    }

    /**
     * GET endpoint: Return only comments where status = 1, display_status = 1, and is_delete = 0
     * (Approved comments enabled for Home Page display).
     */
    public function displayComments(Request $request): JsonResponse
    {
        $query = Comment::where('is_delete', false)
            ->where('status', true)
            ->where('display_status', true)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('per_page') && (int) $request->input('per_page') > 0) {
            $paginated = $query->paginate((int) $request->input('per_page'));

            return response()->json([
                'data' => CommentResource::collection($paginated),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ]);
        }

        $comments = $query->get();

        return response()->json([
            'data' => CommentResource::collection($comments),
            'meta' => [
                'total' => $comments->count(),
            ],
        ]);
    }

    /**
     * GET endpoint: Return only comments where status = 1 and is_delete = 0
     * (All approved comments).
     */
    public function approvedComments(Request $request): JsonResponse
    {
        $query = Comment::where('is_delete', false)
            ->where('status', true)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('per_page') && (int) $request->input('per_page') > 0) {
            $paginated = $query->paginate((int) $request->input('per_page'));

            return response()->json([
                'data' => CommentResource::collection($paginated),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ]);
        }

        $comments = $query->get();

        return response()->json([
            'data' => CommentResource::collection($comments),
            'meta' => [
                'total' => $comments->count(),
            ],
        ]);
    }

    /**
     * Store a newly submitted website comment (defaults to status = 0, display_status = 0, is_delete = 0).
     */
    public function store(StoreCommentRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['status'] = false;
        $payload['display_status'] = false;
        $payload['is_delete'] = false;

        if ($request->hasFile('image') || $request->filled('image')) {
            $imagePath = $this->handleImage($request);
            if ($imagePath !== null) {
                $payload['image'] = $imagePath;
            }
        } elseif ($request->exists('image') && empty($request->input('image'))) {
            $payload['image'] = null;
        }

        $comment = Comment::create($payload);

        try {
            ActivityLogger::log(
                'Website Comment Received',
                "New website comment from {$comment->name}".($comment->company ? " ({$comment->company})" : ''),
                $comment
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment submitted successfully and is pending approval.',
            'data' => new CommentResource($comment),
        ], 201);
    }

    /**
     * Display the specified website comment.
     */
    public function show(int $id): JsonResponse
    {
        $comment = Comment::where('is_delete', false)->findOrFail($id);

        return response()->json([
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Upload, update, or remove image for a comment from the slide drawer.
     */
    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $comment = Comment::where('is_delete', false)->findOrFail($id);

        $imagePath = $this->handleImage($request, $comment);
        $comment->image = $imagePath;
        $comment->save();

        try {
            ActivityLogger::log(
                'Website Comment Image Updated',
                "Updated image for website comment #{$comment->id} ({$comment->name})",
                $comment
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => $imagePath ? 'Comment image uploaded successfully.' : 'Comment image removed successfully.',
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Approve a pending comment (sets status = 1 and display_status = 1).
     */
    public function approve(int $id): JsonResponse
    {
        $comment = Comment::where('is_delete', false)->findOrFail($id);
        $comment->status = true;
        $comment->display_status = true;
        $comment->save();

        try {
            ActivityLogger::log(
                'Website Comment Approved',
                "Approved website comment #{$comment->id} from {$comment->name}",
                $comment
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment approved successfully.',
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Update home page display status (1 = Display, 0 = Not Display) of an approved comment.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $comment = Comment::where('is_delete', false)->findOrFail($id);

        // If image is also included in this request, process it
        if ($request->hasFile('image') || $request->exists('image')) {
            $comment->image = $this->handleImage($request, $comment);
        }

        if ($request->has('display_status') || $request->has('status')) {
            if (! $comment->status) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pending comments must be approved before changing display status.',
                ], 422);
            }

            $rawValue = $request->has('display_status')
                ? $request->input('display_status')
                : $request->input('status');

            $comment->display_status = $this->normalizeDisplayStatus($rawValue);
        }

        $comment->save();

        $displayLabel = $comment->display_status ? 'Display' : 'Not Display';

        try {
            ActivityLogger::log(
                'Website Comment Display Status Updated',
                "Updated website comment #{$comment->id} display status to {$displayLabel}",
                $comment
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => "Comment display status updated to {$displayLabel}.",
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Logically delete a comment (sets is_delete = 1).
     */
    public function destroy(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);
        $comment->logicalDelete();

        try {
            ActivityLogger::log(
                'Website Comment Deleted',
                "Deleted website comment #{$comment->id} from {$comment->name}",
                $comment
            );
        } catch (\Throwable) {
            // Ignore activity logging errors
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
        ]);
    }
}
