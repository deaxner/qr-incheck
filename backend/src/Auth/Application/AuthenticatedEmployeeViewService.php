<?php

namespace App\Auth\Application;

use App\Auth\Dto\AuthenticatedSessionView;
use App\Auth\Dto\AuthUserView;
use App\Auth\Domain\AuthUser;
use App\Employees\Dto\EmployeeIdentityView;
use App\Repository\EmployeeRepository;

class AuthenticatedEmployeeViewService
{
    public function __construct(
        private readonly EmployeeRepository $employeeRepository,
    ) {
    }

    public function build(AuthUser $user): AuthenticatedSessionView
    {
        $employee = $this->employeeRepository->find($user->employeeId);

        return new AuthenticatedSessionView(
            AuthUserView::fromAuthUser($user),
            $employee ? EmployeeIdentityView::fromEmployee($employee) : null,
        );
    }
}
