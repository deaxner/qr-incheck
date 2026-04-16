<?php

namespace App\Auth\Application;

use App\Auth\Domain\AuthUser;
use App\Employees\Application\EmployeeOverviewService;
use App\Repository\EmployeeRepository;

class AuthenticatedEmployeeViewService
{
    public function __construct(
        private readonly EmployeeRepository $employeeRepository,
        private readonly EmployeeOverviewService $employeeOverviewService,
    ) {
    }

    /**
     * @return array{user:array{id:string,email:string,name:string,role:string,employeeId:int},employee:?array<string,mixed>}
     */
    public function build(AuthUser $user): array
    {
        $employee = $this->employeeRepository->find($user->employeeId);

        return [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'employeeId' => $user->employeeId,
            ],
            'employee' => $employee ? $this->employeeOverviewService->getEmployeeOverview($employee) : null,
        ];
    }
}
