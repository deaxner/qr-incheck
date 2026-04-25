<?php

namespace App\Employees\Dto;

use App\Entity\Employee;

final readonly class EmployeeOverviewView
{
    public function __construct(
        public int $id,
        public string $name,
        public string $qrCode,
        public string $status,
        public string $statusLabel,
        public ?string $lastActionAt,
        public EmployeeProfileView $profile,
    ) {
    }

    public static function fromEmployee(Employee $employee, string $status, string $statusLabel, ?string $lastActionAt): self
    {
        return new self(
            $employee->getId(),
            $employee->getName(),
            $employee->getQrCode(),
            $status,
            $statusLabel,
            $lastActionAt,
            EmployeeProfileView::fromPrimitives(
                $employee->getDepartment(),
                $employee->getEmploymentType(),
                $employee->getLocation(),
            ),
        );
    }

    /**
     * @return array{id:int,name:string,qrCode:string,status:string,statusLabel:string,lastActionAt:?string,profile:array{department:string,employmentType:string,location:string}}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'qrCode' => $this->qrCode,
            'status' => $this->status,
            'statusLabel' => $this->statusLabel,
            'lastActionAt' => $this->lastActionAt,
            'profile' => $this->profile->toArray(),
        ];
    }
}
