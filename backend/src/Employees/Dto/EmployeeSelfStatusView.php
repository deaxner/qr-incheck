<?php

namespace App\Employees\Dto;

final readonly class EmployeeSelfStatusView
{
    public function __construct(
        public string $status,
        public ?string $lastClock,
    ) {
    }

    /**
     * @return array{status:string,lastClock:?string}
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'lastClock' => $this->lastClock,
        ];
    }
}
