<?php

namespace App\Service;

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
     * @return list<array{id:int,name:string,qrCode:string,status:string,statusLabel:string,lastActionAt:?string}>
     */
    public function getOverview(): array
    {
        $employees = $this->employeeRepository->findAllOrderedByName();
        $employeeIds = array_values(array_filter(array_map(static fn ($employee) => $employee->getId(), $employees)));
        $openEntries = $this->timeEntryRepository->findOpenEntriesIndexedByEmployeeIds($employeeIds);
        $latestEntries = $this->timeEntryRepository->findLatestEntriesIndexedByEmployeeIds($employeeIds);
        $overview = [];

        foreach ($employees as $employee) {
            $employeeId = $employee->getId();
            $openEntry = $openEntries[$employeeId] ?? null;
            $latestEntry = $latestEntries[$employeeId] ?? null;
            $status = $openEntry ? 'checked_in' : 'checked_out';
            $lastActionAt = null;

            if ($openEntry) {
                $lastActionAt = $openEntry->getCheckInAt()->format('Y-m-d H:i:s T');
            } elseif ($latestEntry && $latestEntry->getCheckOutAt()) {
                $lastActionAt = $latestEntry->getCheckOutAt()->format('Y-m-d H:i:s T');
            } elseif ($latestEntry) {
                $lastActionAt = $latestEntry->getCheckInAt()->format('Y-m-d H:i:s T');
            }

            $overview[] = [
                'id' => $employeeId,
                'name' => $employee->getName(),
                'qrCode' => $employee->getQrCode(),
                'status' => $status,
                'statusLabel' => 'checked_in' === $status ? 'Ingecheckt' : 'Uitgecheckt',
                'lastActionAt' => $lastActionAt,
            ];
        }

        return $overview;
    }
}
