<?php

namespace App\Employees\Application;

use App\Entity\Employee;
use App\Entity\TimeEntry;
use App\Employees\Dto\EmployeeHistoryEntryView;
use App\Employees\Dto\EmployeeHistoryView;
use App\Repository\TimeEntryRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class EmployeeHistoryService
{
    private readonly \DateTimeZone $timezone;

    public function __construct(
        private readonly TimeEntryRepository $timeEntryRepository,
        private readonly EmployeeOverviewService $employeeOverviewService,
        #[Autowire('%app.timezone%')] string $appTimezone,
    ) {
        $this->timezone = new \DateTimeZone($appTimezone);
    }

    public function getForEmployee(Employee $employee): EmployeeHistoryView
    {
        $now = new \DateTimeImmutable('now', $this->timezone);
        $openEntry = $this->timeEntryRepository->findOpenEntryForEmployee($employee);
        $recentEntries = $this->timeEntryRepository->findRecentEntriesForEmployee($employee, 10);
        $weekStart = $now->setTime(0, 0)->modify('monday this week');
        $weekEntries = $this->timeEntryRepository->findEntriesForEmployeeFrom($employee, $weekStart);

        $events = [];

        foreach ($recentEntries as $entry) {
            $events[] = $this->buildEvent($entry, 'checked_in', $entry->getCheckInAt(), $employee->getLocation());

            if ($entry->getCheckOutAt()) {
                $events[] = $this->buildEvent($entry, 'checked_out', $entry->getCheckOutAt(), $employee->getLocation());
            }
        }

        usort(
            $events,
            static fn (EmployeeHistoryEntryView $left, EmployeeHistoryEntryView $right): int => strcmp($right->sortKey, $left->sortKey),
        );

        return new EmployeeHistoryView(
            $this->employeeOverviewService->getOverviewForEmployee($employee),
            $this->sumMinutes($weekEntries, $now),
            $openEntry ? $this->durationInMinutes($openEntry->getCheckInAt(), $now) : null,
            $events,
        );
    }

    private function buildEvent(TimeEntry $entry, string $action, \DateTimeImmutable $timestamp, string $location): EmployeeHistoryEntryView
    {
        return new EmployeeHistoryEntryView(
            sprintf('%d-%s', $entry->getId(), 'checked_in' === $action ? 'in' : 'out'),
            $action,
            $timestamp->format('Y-m-d H:i:s T'),
            $location,
            'checked_in' === $action ? 'onsite' : 'offsite',
            'checked_in' === $action ? 'Ingeklokt' : 'Uitgeklokt',
            $timestamp->format('c'),
        );
    }

    /**
     * @param TimeEntry[] $entries
     */
    private function sumMinutes(array $entries, \DateTimeImmutable $now): int
    {
        $minutes = 0;

        foreach ($entries as $entry) {
            $minutes += $this->durationInMinutes($entry->getCheckInAt(), $entry->getCheckOutAt() ?? $now);
        }

        return $minutes;
    }

    private function durationInMinutes(\DateTimeImmutable $start, \DateTimeImmutable $end): int
    {
        return max(0, (int) floor(($end->getTimestamp() - $start->getTimestamp()) / 60));
    }
}
