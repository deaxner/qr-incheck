<?php

namespace App\Auth\Dto;

use App\Auth\Domain\AuthUser;

final readonly class AuthUserView
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name,
        public string $role,
        public int $employeeId,
    ) {
    }

    public static function fromAuthUser(AuthUser $user): self
    {
        return new self(
            $user->id,
            $user->email,
            $user->name,
            $user->role,
            $user->employeeId,
        );
    }

    /**
     * @return array{id:string,email:string,name:string,role:string,employeeId:int}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'role' => $this->role,
            'employeeId' => $this->employeeId,
        ];
    }
}
