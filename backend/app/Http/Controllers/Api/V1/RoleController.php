<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        return response()->json(RoleResource::collection($roles));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', 'unique:roles,slug'],
            'description' => ['nullable', 'string'],
            'permission_ids' => ['nullable', 'array'],
        ]);

        $role = Role::create($validated);
        if (!empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return (new RoleResource($role->load('permissions')))->response()->setStatusCode(201);
    }

    public function permissions(): JsonResponse
    {
        return response()->json(Permission::all());
    }
}
