<?php

namespace App\Auth\Domain;

final readonly class AuthUser
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name,
        public string $role,
        public int $employeeId,
    ) {
    }

    public function isAdmin(): bool
    {
        return 'admin' === $this->role;
    }

    public function isUser(): bool
    {
        return 'user' === $this->role;
    }
}
