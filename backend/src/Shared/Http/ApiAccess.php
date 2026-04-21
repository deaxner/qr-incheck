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

            return $this->forbidden($message);
        }
    }

    public function forbidden(string $message): JsonResponse
    {
        return new JsonResponse([
            'code' => 'forbidden',
            'message' => $message,
        ], 403);
    }
}
