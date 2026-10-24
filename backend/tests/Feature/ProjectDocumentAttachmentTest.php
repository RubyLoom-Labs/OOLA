<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectDocument;
use App\Models\ProjectStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectDocumentAttachmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Storage::fake('public');
    }

    public function test_project_document_table_exists(): void
    {
        $this->assertTrue(Schema::hasTable('project_documents'));
        $this->assertTrue(Schema::hasColumns('project_documents', [
            'id',
            'project_id',
            'document_name',
            'type',
            'file_path',
            'upload_user_id',
            'is_delete',
        ]));
    }

    public function test_can_upload_project_document_with_document_title_and_category(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();

        $project = Project::create([
            'project_title' => 'CRM Cloud Platform',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $file = UploadedFile::fake()->create('dashboard.png', 500, 'image/png');

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/projects/{$project->id}/attachments", [
            'file' => $file,
            'document_title' => 'Modern CRM Project ban Dashboard',
            'category' => 'Contract & Agreement',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.document_name', 'Modern CRM Project ban Dashboard')
            ->assertJsonPath('data.type', 'Contract & Agreement')
            ->assertJsonPath('data.is_delete', false)
            ->assertJsonPath('data.upload_user_id', $admin->id);

        $documentId = $response->json('data.id');

        $this->assertDatabaseHas('project_documents', [
            'id' => $documentId,
            'project_id' => $project->id,
            'document_name' => 'Modern CRM Project ban Dashboard',
            'type' => 'Contract & Agreement',
            'upload_user_id' => $admin->id,
            'is_delete' => 0,
        ]);
    }

    public function test_can_upload_pdf_document_with_numeric_title_and_special_category(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();

        $project = Project::create([
            'project_title' => 'Cloud Migration Project',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $pdfFile = UploadedFile::fake()->create('493_178066565508.pdf', 3000, 'application/pdf');

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/projects/{$project->id}/attachments", [
            'file' => $pdfFile,
            'document_title' => '493_178066565508',
            'category' => 'Invoice & Quotation',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.document_name', '493_178066565508')
            ->assertJsonPath('data.type', 'Invoice & Quotation')
            ->assertJsonPath('data.is_delete', false)
            ->assertJsonPath('data.upload_user_id', $admin->id);

        $documentId = $response->json('data.id');

        $this->assertDatabaseHas('project_documents', [
            'id' => $documentId,
            'project_id' => $project->id,
            'document_name' => '493_178066565508',
            'type' => 'Invoice & Quotation',
            'upload_user_id' => $admin->id,
            'is_delete' => 0,
        ]);
    }

    public function test_get_attachments_never_returns_is_delete_records(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();

        $project = Project::create([
            'project_title' => 'CRM Cloud Platform',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        // Active document (is_delete = 0)
        $activeDoc = ProjectDocument::create([
            'project_id' => $project->id,
            'document_name' => 'Active Contract',
            'type' => 'Contract & Agreement',
            'file_path' => 'https://example.com/active.pdf',
            'upload_user_id' => $admin->id,
            'is_delete' => false,
        ]);

        // Deleted document (is_delete = 1)
        $deletedDoc = ProjectDocument::create([
            'project_id' => $project->id,
            'document_name' => 'Deleted Old Contract',
            'type' => 'Contract & Agreement',
            'file_path' => 'https://example.com/deleted.pdf',
            'upload_user_id' => $admin->id,
            'is_delete' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$project->id}/attachments");

        $response->assertStatus(200);

        $returnedNames = collect($response->json('data'))->pluck('document_name')->toArray();
        $this->assertContains('Active Contract', $returnedNames);
        $this->assertNotContains('Deleted Old Contract', $returnedNames);

        // Alias endpoint /documents behaves identically
        $docResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$project->id}/documents");
        $docResponse->assertStatus(200);
        $docNames = collect($docResponse->json('data'))->pluck('document_name')->toArray();
        $this->assertEquals($returnedNames, $docNames);
    }

    public function test_can_update_document_and_edit_is_delete_column(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();

        $project = Project::create([
            'project_title' => 'CRM Cloud Platform',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $doc = ProjectDocument::create([
            'project_id' => $project->id,
            'document_name' => 'Initial Title',
            'type' => 'General',
            'file_path' => 'https://example.com/file.pdf',
            'upload_user_id' => $admin->id,
            'is_delete' => false,
        ]);

        // Update document title and category
        $updateResponse = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/projects/{$project->id}/attachments/{$doc->id}", [
            'document_title' => 'Updated Contract Title',
            'category' => 'Contract & Agreement',
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.document_name', 'Updated Contract Title')
            ->assertJsonPath('data.type', 'Contract & Agreement');

        // Edit is_delete column to 1 (soft delete via update)
        $deleteViaUpdate = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/projects/{$project->id}/attachments/{$doc->id}", [
            'is_delete' => true,
        ]);

        $deleteViaUpdate->assertStatus(200)
            ->assertJsonPath('data.is_delete', true);

        $this->assertDatabaseHas('project_documents', [
            'id' => $doc->id,
            'is_delete' => 1,
        ]);

        // Re-enable is_delete to 0 via update
        $restoreViaUpdate = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/projects/{$project->id}/attachments/{$doc->id}", [
            'is_delete' => false,
        ]);

        $restoreViaUpdate->assertStatus(200)
            ->assertJsonPath('data.is_delete', false);

        $this->assertDatabaseHas('project_documents', [
            'id' => $doc->id,
            'is_delete' => 0,
        ]);
    }

    public function test_can_soft_delete_and_restore_document(): void
    {
        $admin = User::where('email', 'admin@ooralabz.com')->first();
        $company = Company::first();
        $stage = ProjectStage::first();

        $project = Project::create([
            'project_title' => 'CRM Cloud Platform',
            'customer_id' => $company->id,
            'stage_id' => $stage->id,
            'status' => 'In Progress',
        ]);

        $doc = ProjectDocument::create([
            'project_id' => $project->id,
            'document_name' => 'Document To Delete',
            'type' => 'Contract & Agreement',
            'file_path' => 'https://example.com/delete-me.pdf',
            'upload_user_id' => $admin->id,
            'is_delete' => false,
        ]);

        // 1. Delete document
        $delResponse = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/projects/{$project->id}/attachments/{$doc->id}");
        $delResponse->assertStatus(200)
            ->assertJsonPath('message', 'Document removed successfully.');

        $this->assertDatabaseHas('project_documents', [
            'id' => $doc->id,
            'is_delete' => 1,
        ]);

        // 2. Index must NOT return it
        $indexResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/projects/{$project->id}/attachments");
        $indexResponse->assertStatus(200);
        $names = collect($indexResponse->json('data'))->pluck('document_name')->toArray();
        $this->assertNotContains('Document To Delete', $names);

        // 3. Restore document
        $restoreResponse = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/projects/{$project->id}/attachments/{$doc->id}/restore");
        $restoreResponse->assertStatus(200)
            ->assertJsonPath('message', 'Document restored successfully.')
            ->assertJsonPath('data.is_delete', false);

        $this->assertDatabaseHas('project_documents', [
            'id' => $doc->id,
            'is_delete' => 0,
        ]);
    }
}
