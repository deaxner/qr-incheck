<?php

namespace App\Clocking\Dto;

use App\Employees\Dto\EmployeeIdentityView;

final readonly class ScanResponseView
{
    public function __construct(
        public string $action,
        public string $timestamp,
        public EmployeeIdentityView $employee,
    ) {
    }

    /**
     * @return array{
     *   action:string,
     *   timestamp:string,
     *   employee: array{id:int,name:string,qrCode:string,profile:array{department:string,employmentType:string,location:string}}
     * }
     */
    public function toArray(): array
    {
        return [
            'action' => $this->action,
            'timestamp' => $this->timestamp,
            'employee' => $this->employee->toArray(),
        ];
    }
}
