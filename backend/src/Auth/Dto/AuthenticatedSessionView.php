<?php

namespace App\Auth\Dto;

use App\Employees\Dto\EmployeeIdentityView;

final readonly class AuthenticatedSessionView
{
    public function __construct(
        public AuthUserView $user,
        public ?EmployeeIdentityView $employee,
    ) {
    }

    /**
     * @return array{
     *   user:array{id:string,email:string,name:string,role:string,employeeId:int},
     *   employee:?array{id:int,name:string,qrCode:string,profile:array{department:string,employmentType:string,location:string}}
     * }
     */
    public function toArray(): array
    {
        return [
            'user' => $this->user->toArray(),
            'employee' => $this->employee?->toArray(),
        ];
    }
}
