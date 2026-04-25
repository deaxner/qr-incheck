<?php

namespace App\Auth\Dto;

final readonly class AuthLoginResponseView
{
    public function __construct(
        public string $token,
        public AuthUserView $user,
    ) {
    }

    /**
     * @return array{
     *   token:string,
     *   user:array{id:string,email:string,name:string,role:string,employeeId:int}
     * }
     */
    public function toArray(): array
    {
        return [
            'token' => $this->token,
            'user' => $this->user->toArray(),
        ];
    }
}
