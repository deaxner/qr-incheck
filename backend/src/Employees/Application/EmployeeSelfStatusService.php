<?php

namespace App\Employees\Application;

use App\Entity\Employee;
use App\Repository\TimeEntryRepository;

class EmployeeSelfStatusService
{
    public function __construct(
        private readonly TimeEntryRepository $timeEntryRepository,
    ) {
    }

    /**
     * @return array{status:string,lastClock:?string}
     */
    public function getForEmployee(Employee $employee): array
    {
        $openEntry = $this->timeEntryRepository->findOpenEntryForEmployee($employee);
        $latestEntry = $this->timeEntryRepository->findLatestEntriesIndexedByEmployeeIds([$employee->getId()])[$employee->getId()] ?? null;
        $lastClock = null;

        if ($openEntry) {
            $lastClock = $openEntry->getCheckInAt()->format(\DateTimeInterface::ATOM);
        } elseif ($latestEntry && $latestEntry->getCheckOutAt()) {
            $lastClock = $latestEntry->getCheckOutAt()->format(\DateTimeInterface::ATOM);
        } elseif ($latestEntry) {
            $lastClock = $latestEntry->getCheckInAt()->format(\DateTimeInterface::ATOM);
        }

        return [
            'status' => $openEntry ? 'IN' : 'OUT',
            'lastClock' => $lastClock,
        ];
    }
}
