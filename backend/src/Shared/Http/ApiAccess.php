<?php

namespace App\Shared\Http;

use App\Auth\Application\AuthContext;
use App\Auth\Domain\AuthUser;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ApiAccess
{
    public function __construct(
        private readonly AuthContext $authContext,
        private readonly ApiProblemResponseFactory $apiProblemResponseFactory,
    ) {
    }

    public function requireAdmin(Request $request, string $message): AuthUser|JsonResponse
    {
        try {
            return $this->authContext->requireAdmin($request);
        } catch (\RuntimeException $exception) {
            if ('forbidden' !== $exception->getMessage()) {
                throw $exception;
            }

            return $this->forbiddenForRequest($request, $message);
        }
    }

    public function forbidden(string $message): JsonResponse
    {
        return new JsonResponse([
            'code' => 'forbidden',
            'message' => $message,
        ], 403);
    }

    public function forbiddenForRequest(Request $request, string $message): JsonResponse
    {
        return $this->apiProblemResponseFactory->create($request, 'forbidden', $message, 403);
    }
}
