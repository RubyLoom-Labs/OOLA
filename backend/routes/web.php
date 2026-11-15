<?php

use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\InquiryController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Website Inquiry & Comment Routes (Protected by Sanctum Bearer Token)
|--------------------------------------------------------------------------
*/
Route::withoutMiddleware([ValidateCsrfToken::class])
    ->middleware('auth:sanctum')
    ->group(function () {
        foreach (['inquiries', 'inquiry', 'inquery', 'inqueries', 'website/inquiries', 'website/inquiry', 'website/inquery', 'website/inqueries'] as $inqPath) {
            Route::get("/{$inqPath}", [InquiryController::class, 'index']);
            Route::post("/{$inqPath}", [InquiryController::class, 'store']);
            Route::get("/{$inqPath}/{id}", [InquiryController::class, 'show'])->whereNumber('id');
            Route::match(['post', 'put', 'patch'], "/{$inqPath}/{id}/convert-to-lead", [InquiryController::class, 'convertToLead'])->whereNumber('id');
            Route::delete("/{$inqPath}/{id}", [InquiryController::class, 'destroy'])->whereNumber('id');
        }

        foreach (['comments', 'comment', 'website/comments', 'website/comment'] as $cmtPath) {
            Route::get("/{$cmtPath}", [CommentController::class, 'index']);
            Route::post("/{$cmtPath}", [CommentController::class, 'store']);
            Route::get("/{$cmtPath}/{id}", [CommentController::class, 'show'])->whereNumber('id');
            Route::match(['post', 'put', 'patch'], "/{$cmtPath}/{id}/image", [CommentController::class, 'uploadImage'])->whereNumber('id');
            Route::match(['post', 'put', 'patch'], "/{$cmtPath}/{id}/approve", [CommentController::class, 'approve'])->whereNumber('id');
            Route::match(['post', 'put', 'patch'], "/{$cmtPath}/{id}/status", [CommentController::class, 'updateStatus'])->whereNumber('id');
            Route::match(['put', 'patch'], "/{$cmtPath}/{id}", [CommentController::class, 'updateStatus'])->whereNumber('id');
            Route::delete("/{$cmtPath}/{id}", [CommentController::class, 'destroy'])->whereNumber('id');
        }
    });
