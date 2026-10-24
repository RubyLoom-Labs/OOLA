<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProjectAttachmentController extends Controller
{
    /**
     * List all active documents for a project (never returns is_delete = 1).
     */
    public function index(Project $project): JsonResponse
    {
        $documents = $project->documents()
            ->with('uploader:id,name,email')
            ->latest()
            ->get();

        return response()->json([
            'data' => $documents,
        ]);
    }

    /**
     * Upload and store a new document for the project.
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        // 1. Intercept PHP ini-level file upload errors (e.g. UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE)
        if (! empty($_FILES)) {
            foreach ($_FILES as $inputKey => $fileInfo) {
                if (isset($fileInfo['error']) && $fileInfo['error'] !== UPLOAD_ERR_OK && $fileInfo['error'] !== UPLOAD_ERR_NO_FILE) {
                    $maxUpload = ini_get('upload_max_filesize') ?: '64M';
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => "The uploaded file exceeds the server upload limit ({$maxUpload}). Please upload a smaller file.",
                        UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the form upload limit.',
                        UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded. Please try again.',
                        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder on server.',
                        UPLOAD_ERR_CANT_WRITE => 'Failed to write uploaded file to disk.',
                        UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
                    ];
                    $msg = $errorMessages[$fileInfo['error']] ?? 'The file failed to upload to the server.';

                    return response()->json([
                        'message' => $msg,
                        'errors' => [
                            $inputKey => [$msg],
                        ],
                    ], 422);
                }
            }
        }

        // 2. Identify uploaded file under various field names
        $fileKey = null;
        foreach (['file', 'document', 'attachment', 'upload'] as $key) {
            if ($request->hasFile($key) || $request->has($key)) {
                $fileKey = $key;
                break;
            }
        }
        $fileKey = $fileKey ?: 'file';

        // 3. Validate request data
        $validator = Validator::make($request->all(), [
            'file' => ['nullable', 'file', 'max:65536'], // up to 64MB
            'document' => ['nullable', 'file', 'max:65536'],
            'attachment' => ['nullable', 'file', 'max:65536'],
            'upload' => ['nullable', 'file', 'max:65536'],
            'file_name' => ['nullable', 'max:255'],
            'document_title' => ['nullable', 'max:255'],
            'document_name' => ['nullable', 'max:255'],
            'title' => ['nullable', 'max:255'],
            'name' => ['nullable', 'max:255'],
            'category' => ['nullable', 'max:100'],
            'type' => ['nullable', 'max:100'],
            'file_url' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string'],
            'upload_user_id' => ['nullable', 'exists:users,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $documentName = $request->input('document_title')
            ?: ($request->input('document_name')
            ?: ($request->input('file_name')
            ?: ($request->input('title')
            ?: $request->input('name'))));

        if ($documentName !== null) {
            $documentName = trim((string) $documentName);
        }

        $type = $request->input('category')
            ?: ($request->input('type')
            ?: 'General');

        if ($type !== null) {
            $type = trim((string) $type);
        }

        $filePath = '';
        $mimeType = 'application/octet-stream';
        $fileSize = 0;

        $uploadedFile = $request->file($fileKey)
            ?: ($request->file('file')
            ?: ($request->file('document')
            ?: ($request->file('attachment')
            ?: $request->file('upload'))));

        if ($uploadedFile && $uploadedFile->isValid()) {
            $originalName = $uploadedFile->getClientOriginalName();
            if (empty($documentName)) {
                $documentName = pathinfo($originalName, PATHINFO_FILENAME) ?: $originalName;
            }
            $mimeType = $uploadedFile->getClientMimeType() ?: 'application/octet-stream';
            $fileSize = $uploadedFile->getSize() ?: 0;

            $storedPath = $uploadedFile->store("attachments/projects/{$project->id}", 'public');
            $filePath = Storage::disk('public')->url($storedPath);
        } elseif ($request->filled('file_url') || $request->filled('file_path')) {
            $filePath = $request->input('file_url') ?: $request->input('file_path');
            if (empty($documentName)) {
                $documentName = basename($filePath) ?: 'Project Document';
            }
            $fileSize = (int) $request->input('file_size', 0);
            $mimeType = $request->input('mime_type', 'application/octet-stream');
        } else {
            return response()->json([
                'message' => 'Please provide a file to upload or a document URL.',
                'errors' => [
                    'file' => ['Please provide a file to upload or a document URL.'],
                ],
            ], 422);
        }

        $userId = $request->input('upload_user_id') ?: (Auth::id() ?: $request->user()?->id);

        $document = $project->documents()->create([
            'document_name' => $documentName,
            'type' => $type,
            'file_path' => $filePath,
            'upload_user_id' => $userId,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'is_delete' => false,
        ]);

        $document->load('uploader:id,name,email');

        return response()->json([
            'message' => 'Document saved successfully',
            'data' => $document,
        ], 201);
    }

    /**
     * Display a single document (only active where is_delete = 0).
     */
    public function show(Project $project, int|string $attachment): JsonResponse
    {
        $document = $project->documents()
            ->with('uploader:id,name,email')
            ->findOrFail($attachment);

        return response()->json([
            'data' => $document,
        ]);
    }

    /**
     * Update an existing document (title, category/type, file, is_delete).
     */
    public function update(Request $request, Project $project, int|string $attachment): JsonResponse
    {
        $document = ProjectDocument::withoutGlobalScopes()
            ->where('project_id', $project->id)
            ->findOrFail($attachment);

        $validator = Validator::make($request->all(), [
            'file' => ['nullable', 'file', 'max:65536'],
            'document' => ['nullable', 'file', 'max:65536'],
            'attachment' => ['nullable', 'file', 'max:65536'],
            'document_title' => ['nullable', 'max:255'],
            'document_name' => ['nullable', 'max:255'],
            'file_name' => ['nullable', 'max:255'],
            'category' => ['nullable', 'max:100'],
            'type' => ['nullable', 'max:100'],
            'file_url' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string'],
            'is_delete' => ['nullable'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->has('document_title') || $request->has('document_name') || $request->has('file_name')) {
            $newName = $request->input('document_title')
                ?: ($request->input('document_name')
                ?: $request->input('file_name'));
            $document->document_name = trim((string) $newName);
        }

        if ($request->has('category') || $request->has('type')) {
            $newType = $request->input('category') ?: $request->input('type');
            $document->type = trim((string) $newType);
        }

        $uploadedFile = $request->file('file')
            ?: ($request->file('document')
            ?: $request->file('attachment'));

        if ($uploadedFile && $uploadedFile->isValid()) {
            $storedPath = $uploadedFile->store("attachments/projects/{$project->id}", 'public');
            $document->file_path = Storage::disk('public')->url($storedPath);
            $document->mime_type = $uploadedFile->getClientMimeType() ?: 'application/octet-stream';
            $document->file_size = $uploadedFile->getSize() ?: 0;
        } elseif ($request->filled('file_url') || $request->filled('file_path')) {
            $document->file_path = $request->input('file_url') ?: $request->input('file_path');
        }

        if ($request->has('is_delete')) {
            $isDelete = filter_var($request->input('is_delete'), FILTER_VALIDATE_BOOLEAN);
            $document->is_delete = $isDelete;
            if ($isDelete) {
                $document->deleted_at = now();
                $document->deleted_by = Auth::id() ?: $request->user()?->id;
            } else {
                $document->deleted_at = null;
                $document->deleted_by = null;
            }
        }

        $document->save();
        $document->load('uploader:id,name,email');

        return response()->json([
            'message' => 'Document updated successfully',
            'data' => $document,
        ]);
    }

    /**
     * Soft delete a document (is_delete = 1).
     */
    public function destroy(Project $project, int|string $attachment): JsonResponse
    {
        $document = ProjectDocument::where('project_id', $project->id)->findOrFail($attachment);

        $document->update([
            'is_delete' => true,
            'deleted_at' => now(),
            'deleted_by' => Auth::id() ?: request()->user()?->id,
        ]);

        return response()->json([
            'message' => 'Document removed successfully.',
        ]);
    }

    /**
     * Restore a soft deleted document (is_delete = 0).
     */
    public function restore(Project $project, int|string $attachment): JsonResponse
    {
        $document = ProjectDocument::withoutGlobalScopes()
            ->where('project_id', $project->id)
            ->where('is_delete', true)
            ->findOrFail($attachment);

        $document->update([
            'is_delete' => false,
            'deleted_at' => null,
            'deleted_by' => null,
        ]);

        $document->load('uploader:id,name,email');

        return response()->json([
            'message' => 'Document restored successfully.',
            'data' => $document,
        ]);
    }
}
