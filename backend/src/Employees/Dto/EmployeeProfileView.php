<?php

namespace App\Employees\Dto;

final readonly class EmployeeProfileView
{
    public function __construct(
        public string $department,
        public string $employmentType,
        public string $location,
    ) {
    }

    public static function fromPrimitives(string $department, string $employmentType, string $location): self
    {
        return new self($department, $employmentType, $location);
    }

    /**
     * @return array{department:string,employmentType:string,location:string}
     */
    public function toArray(): array
    {
        return [
            'department' => $this->department,
            'employmentType' => $this->employmentType,
            'location' => $this->location,
        ];
    }
}
