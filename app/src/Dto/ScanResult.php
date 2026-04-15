<?php

namespace App\Dto;

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
