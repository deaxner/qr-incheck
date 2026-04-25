<?php

namespace App\Employees\Application;

use App\Entity\Employee;
use App\Employees\Dto\EmployeeOverviewView;
use App\Repository\EmployeeRepository;
use App\Repository\TimeEntryRepository;

class EmployeeOverviewService
{
    public function __construct(
        private readonly EmployeeRepository $employeeRepository,
        private readonly TimeEntryRepository $timeEntryRepository,
    ) {
    }

    /**
     * @return list<EmployeeOverviewView>
     */
    public function getOverview(): array
    {
        $employees = $this->employeeRepository->findAllOrderedByName();
        $employeeIds = array_values(array_filter(array_map(static fn ($employee) => $employee->getId(), $employees)));
        $openEntries = $this->timeEntryRepository->findOpenEntriesIndexedByEmployeeIds($employeeIds);
        $latestEntries = $this->timeEntryRepository->findLatestEntriesIndexedByEmployeeIds($employeeIds);
        $overview = [];

        foreach ($employees as $employee) {
            $overview[] = $this->buildOverviewEntry(
                $employee,
                $openEntries[$employee->getId()] ?? null,
                $latestEntries[$employee->getId()] ?? null,
            );
        }

        return $overview;
    }

    public function getOverviewForEmployee(Employee $employee): EmployeeOverviewView
    {
        return $this->buildOverviewEntry(
            $employee,
            $this->timeEntryRepository->findOpenEntryForEmployee($employee),
            $this->timeEntryRepository->findLatestEntriesIndexedByEmployeeIds([$employee->getId()])[$employee->getId()] ?? null,
        );
    }

    private function buildOverviewEntry(Employee $employee, ?\App\Entity\TimeEntry $openEntry, ?\App\Entity\TimeEntry $latestEntry): EmployeeOverviewView
    {
        $status = $openEntry ? 'checked_in' : 'checked_out';
        $lastActionAt = null;

        if ($openEntry) {
            $lastActionAt = $openEntry->getCheckInAt()->format('Y-m-d H:i:s T');
        } elseif ($latestEntry && $latestEntry->getCheckOutAt()) {
            $lastActionAt = $latestEntry->getCheckOutAt()->format('Y-m-d H:i:s T');
        } elseif ($latestEntry) {
            $lastActionAt = $latestEntry->getCheckInAt()->format('Y-m-d H:i:s T');
        }

        return EmployeeOverviewView::fromEmployee(
            $employee,
            $status,
            'checked_in' === $status ? 'Ingecheckt' : 'Uitgecheckt',
            $lastActionAt,
        );
    }
}
