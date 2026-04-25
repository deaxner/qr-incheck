<?php

namespace App\Employees\Dto;

use App\Entity\Employee;

final readonly class EmployeeIdentityView
{
    public function __construct(
        public int $id,
        public string $name,
        public string $qrCode,
        public EmployeeProfileView $profile,
    ) {
    }

    public static function fromEmployee(Employee $employee): self
    {
        return new self(
            $employee->getId(),
            $employee->getName(),
            $employee->getQrCode(),
            EmployeeProfileView::fromPrimitives(
                $employee->getDepartment(),
                $employee->getEmploymentType(),
                $employee->getLocation(),
            ),
        );
    }

    /**
     * @return array{id:int,name:string,qrCode:string,profile:array{department:string,employmentType:string,location:string}}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'qrCode' => $this->qrCode,
            'profile' => $this->profile->toArray(),
        ];
    }
}
