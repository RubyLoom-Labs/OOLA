<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosting_domains', function (Blueprint $table) {
            $table->id();
            $table->string('domain_name');
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('provider')->nullable(); // GoDaddy, Namecheap, Cloudflare, etc.
            $table->date('purchase_date')->nullable();
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->date('renew_date')->nullable();
            $table->text('encrypted_credentials')->nullable(); // Encrypted at rest
            $table->string('status')->default('Active'); // Active, Expired, Pending Transfer

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('renew_date');
            $table->index('status');
        });

        Schema::create('hosting_servers', function (Blueprint $table) {
            $table->id();
            $table->string('server_name');
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('purpose')->nullable(); // Production, Staging, Backup, Email
            $table->string('provider')->nullable(); // AWS, DigitalOcean, Hetzner, Linode
            $table->string('ip_address')->nullable();
            $table->string('plan')->nullable();
            
            $table->date('purchase_date')->nullable();
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->date('renew_date')->nullable();
            $table->text('encrypted_credentials')->nullable(); // Encrypted at rest
            $table->foreignId('domain_id')->nullable()->constrained('hosting_domains')->nullOnDelete();
            $table->string('status')->default('Active'); // Active, Inactive, Terminated

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('renew_date');
            $table->index('status');
        });

        Schema::create('hosting_services', function (Blueprint $table) {
            $table->id();
            $table->string('service_type'); // Shared Hosting, VPS, Dedicated, SSL, Google Workspace, Microsoft 365
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->nullable();
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->date('renew_date')->nullable();
            $table->text('encrypted_credentials')->nullable();
            $table->string('status')->default('Active');

            // Soft delete & audit
            $table->boolean('is_delete')->default(false)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('renew_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_services');
        Schema::dropIfExists('hosting_servers');
        Schema::dropIfExists('hosting_domains');
    }
};
