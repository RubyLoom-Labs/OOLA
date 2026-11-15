<?php

namespace App\Http\Requests\Comment;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name')
            ?? $this->input('your_name')
            ?? $this->input('yourName')
            ?? $this->input('full_name');

        $company = $this->input('company')
            ?? $this->input('company_name')
            ?? $this->input('companyName');

        $title = $this->input('title')
            ?? $this->input('subject')
            ?? $this->input('designation');

        $comment = $this->input('comment')
            ?? $this->input('message');

        $merged = [];

        if ($name !== null) {
            $merged['name'] = is_string($name) ? trim($name) : $name;
        }
        if ($company !== null) {
            $merged['company'] = is_string($company) ? trim($company) : $company;
        }
        if ($title !== null) {
            $merged['title'] = is_string($title) ? trim($title) : $title;
        }
        if ($comment !== null) {
            $merged['comment'] = is_string($comment) ? trim($comment) : $comment;
        }

        if (! empty($merged)) {
            $this->merge($merged);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:500'],
            'comment' => ['required', 'string'],
            'image' => ['nullable'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Name is required.',
            'comment.required' => 'Comment is required.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => $validator->errors()->first() ?: 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
