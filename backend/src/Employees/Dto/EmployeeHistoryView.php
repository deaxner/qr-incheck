<?php

namespace App\Employees\Dto;

final readonly class EmployeeHistoryView
{
    /**
     * @param list<EmployeeHistoryEntryView> $entries
     */
    public function __construct(
        public EmployeeOverviewView $employee,
        public int $weekMinutes,
        public ?int $activeSessionMinutes,
        public array $entries,
    ) {
    }

    /**
     * @return array{
     *   employee: array{id:int,name:string,qrCode:string,status:string,statusLabel:string,lastActionAt:?string,profile:array{department:string,employmentType:string,location:string}},
     *   summary: array{weekMinutes:int,activeSessionMinutes:?int},
     *   entries: list<array{id:string,action:string,timestamp:string,location:string,state:string,stateLabel:string}>
     * }
     */
    public function toArray(): array
    {
        return [
            'employee' => $this->employee->toArray(),
            'summary' => [
                'weekMinutes' => $this->weekMinutes,
                'activeSessionMinutes' => $this->activeSessionMinutes,
            ],
            'entries' => array_map(
                static fn (EmployeeHistoryEntryView $entry): array => $entry->toArray(),
                $this->entries,
            ),
        ];
    }
}
