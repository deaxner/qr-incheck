<?php

namespace App\Employees\Application;

use App\Entity\Employee;
use App\Entity\TimeEntry;
use App\Repository\TimeEntryRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class EmployeeHistoryService
{
    private readonly \DateTimeZone $timezone;

    public function __construct(
        private readonly TimeEntryRepository $timeEntryRepository,
        #[Autowire('%app.timezone%')] string $appTimezone,
    ) {
        $this->timezone = new \DateTimeZone($appTimezone);
    }

    /**
     * @return array{
     *   employee: array{id:int|null,name:string,qrCode:string,status:string,statusLabel:string,profile:array{department:string,employmentType:string,location:string}},
     *   summary: array{weekMinutes:int,activeSessionMinutes:?int},
     *   entries: list<array{id:string,action:string,timestamp:string,location:string,state:string,stateLabel:string}>
     * }
     */
    public function getForEmployee(Employee $employee): array
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

        usort($events, static fn (array $left, array $right) => strcmp($right['sortKey'], $left['sortKey']));

        return [
            'employee' => [
                'id' => $employee->getId(),
                'name' => $employee->getName(),
                'qrCode' => $employee->getQrCode(),
                'status' => $openEntry ? 'checked_in' : 'checked_out',
                'statusLabel' => $openEntry ? 'Ingecheckt' : 'Uitgecheckt',
                'profile' => [
                    'department' => $employee->getDepartment(),
                    'employmentType' => $employee->getEmploymentType(),
                    'location' => $employee->getLocation(),
                ],
            ],
            'summary' => [
                'weekMinutes' => $this->sumMinutes($weekEntries, $now),
                'activeSessionMinutes' => $openEntry ? $this->durationInMinutes($openEntry->getCheckInAt(), $now) : null,
            ],
            'entries' => array_map(static function (array $event): array {
                unset($event['sortKey']);

                return $event;
            }, $events),
        ];
    }

    /**
     * @return array{id:string,action:string,timestamp:string,location:string,state:string,stateLabel:string,sortKey:string}
     */
    private function buildEvent(TimeEntry $entry, string $action, \DateTimeImmutable $timestamp, string $location): array
    {
        return [
            'id' => sprintf('%d-%s', $entry->getId(), 'checked_in' === $action ? 'in' : 'out'),
            'action' => $action,
            'timestamp' => $timestamp->format('Y-m-d H:i:s T'),
            'location' => $location,
            'state' => 'checked_in' === $action ? 'onsite' : 'offsite',
            'stateLabel' => 'checked_in' === $action ? 'Ingeklokt' : 'Uitgeklokt',
            'sortKey' => $timestamp->format('c'),
        ];
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
