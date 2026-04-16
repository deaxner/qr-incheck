<?php

namespace App\Auth\Application;

use App\Auth\Domain\AuthUser;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpFoundation\Request;

class AuthContext
{
    public const REQUEST_ATTRIBUTE = '_auth_user';

    public function requireUser(Request $request): AuthUser
    {
        $user = $request->attributes->get(self::REQUEST_ATTRIBUTE);

        if (!$user instanceof AuthUser) {
            throw new BadRequestException('Authenticated user missing from request context.');
        }

        return $user;
    }

    public function requireAdmin(Request $request): AuthUser
    {
        $user = $this->requireUser($request);

        if (!$user->isAdmin()) {
            throw new \RuntimeException('forbidden');
        }

        return $user;
    }

    public function ensureCanAccessEmployee(Request $request, int $employeeId): AuthUser
    {
        $user = $this->requireUser($request);

        if ($user->isAdmin() || $user->employeeId === $employeeId) {
            return $user;
        }

        throw new \RuntimeException('forbidden');
    }
}
