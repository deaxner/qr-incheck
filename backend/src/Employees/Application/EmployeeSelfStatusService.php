<?php

namespace App\Employees\Application;

use App\Entity\Employee;
use App\Employees\Dto\EmployeeSelfStatusView;
use App\Repository\TimeEntryRepository;

class EmployeeSelfStatusService
{
    public function __construct(
        private readonly TimeEntryRepository $timeEntryRepository,
    ) {
    }

    public function getForEmployee(Employee $employee): EmployeeSelfStatusView
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

        return new EmployeeSelfStatusView(
            $openEntry ? 'IN' : 'OUT',
            $lastClock,
        );
    }
}
