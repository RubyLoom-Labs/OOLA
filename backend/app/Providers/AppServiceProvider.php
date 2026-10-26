<?php

namespace App\Providers;

use App\Models\Company;
use App\Models\Lead;
use App\Models\Project;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Relation::morphMap([
            'project' => Project::class,
            'Project' => Project::class,
            'lead' => Lead::class,
            'Lead' => Lead::class,
            'company' => Company::class,
            'Company' => Company::class,
        ]);
    }
}
