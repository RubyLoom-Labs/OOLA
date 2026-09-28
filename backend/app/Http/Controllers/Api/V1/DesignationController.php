<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DesignationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Designation::with('department')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string'],
        ]);
        $designation = Designation::create($validated);
        return response()->json($designation, 201);
    }
}
