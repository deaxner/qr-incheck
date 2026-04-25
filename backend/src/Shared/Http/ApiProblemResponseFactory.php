<?php

namespace App\Shared\Http;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final readonly class ApiProblemResponseFactory
{
    /**
     * @param array<string, mixed> $details
     */
    public function create(
        Request $request,
        string $code,
        string $message,
        int $status,
        array $details = [],
    ): JsonResponse {
        return new JsonResponse(
            (new ApiProblem(
                $code,
                $message,
                RequestContext::getRequestId($request),
                $details,
            ))->toArray(),
            $status,
        );
    }
}
