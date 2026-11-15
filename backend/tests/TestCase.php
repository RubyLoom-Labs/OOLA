<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Specify the default seeder used strictly during in-memory SQLite testing.
     */
    protected string $seeder = TestDatabaseSeeder::class;
}
