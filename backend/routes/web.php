<?php

use App\Http\Controllers\Api\V1\InquiryController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Website Inquiry Routes (Web GET for CRM & Open POST for Website)
|--------------------------------------------------------------------------
*/
Route::withoutMiddleware([ValidateCsrfToken::class])->group(function () {
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::post('/inquiries', [InquiryController::class, 'store']);
    Route::get('/inquiries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/inquiry', [InquiryController::class, 'index']);
    Route::post('/inquiry', [InquiryController::class, 'store']);
    Route::get('/inquiry/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/inquery', [InquiryController::class, 'index']);
    Route::post('/inquery', [InquiryController::class, 'store']);
    Route::get('/inquery/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/inqueries', [InquiryController::class, 'index']);
    Route::post('/inqueries', [InquiryController::class, 'store']);
    Route::get('/inqueries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inquiries', [InquiryController::class, 'index']);
    Route::post('/website/inquiries', [InquiryController::class, 'store']);
    Route::get('/website/inquiries/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inquiry', [InquiryController::class, 'index']);
    Route::post('/website/inquiry', [InquiryController::class, 'store']);
    Route::get('/website/inquiry/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inquery', [InquiryController::class, 'index']);
    Route::post('/website/inquery', [InquiryController::class, 'store']);
    Route::get('/website/inquery/{id}', [InquiryController::class, 'show'])->whereNumber('id');

    Route::get('/website/inqueries', [InquiryController::class, 'index']);
    Route::post('/website/inqueries', [InquiryController::class, 'store']);
    Route::get('/website/inqueries/{id}', [InquiryController::class, 'show'])->whereNumber('id');
});
