<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDocument extends BaseModel
{
    protected $table = 'project_documents';

    protected $fillable = [
        'project_id',
        'document_name',
        'type',
        'file_path',
        'upload_user_id',
        'file_size',
        'mime_type',
        'is_delete',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_delete' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'document_title',
        'category',
        'file_name',
        'uploaded_by',
    ];

    /**
     * Associated project.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * User who uploaded this document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'upload_user_id');
    }

    public function uploadUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'upload_user_id');
    }

    /**
     * Backward-compatibility accessors and mutators
     */
    public function getDocumentTitleAttribute(): ?string
    {
        return $this->document_name;
    }

    public function setDocumentTitleAttribute(?string $value): void
    {
        $this->attributes['document_name'] = $value;
    }

    public function getCategoryAttribute(): ?string
    {
        return $this->type;
    }

    public function setCategoryAttribute(?string $value): void
    {
        $this->attributes['type'] = $value;
    }

    public function getFileNameAttribute(): ?string
    {
        return $this->document_name;
    }

    public function setFileNameAttribute(?string $value): void
    {
        if (empty($this->attributes['document_name'])) {
            $this->attributes['document_name'] = $value;
        }
    }

    public function getUploadedByAttribute(): ?int
    {
        return $this->upload_user_id;
    }

    public function setUploadedByAttribute(?int $value): void
    {
        $this->attributes['upload_user_id'] = $value;
    }
}
