<?php

namespace App\Clocking\Dto;

use App\Entity\Employee;

final readonly class ScanResult
{
    public function __construct(
        public Employee $employee,
        public string $action,
        public \DateTimeImmutable $timestamp,
    ) {
    }
}
