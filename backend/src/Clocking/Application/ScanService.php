<?php

namespace App\Clocking\Application;

use App\Clocking\Dto\ScanResult;
use App\Clocking\Exception\UnknownQrCodeException;
use App\Entity\TimeEntry;
use App\Realtime\Application\EmployeeRealtimePublisher;
use App\Repository\EmployeeRepository;
use App\Repository\TimeEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class ScanService
{
    private readonly \DateTimeZone $timezone;

    public function __construct(
        private readonly EmployeeRepository $employeeRepository,
        private readonly TimeEntryRepository $timeEntryRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly EmployeeRealtimePublisher $employeeRealtimePublisher,
        #[Autowire('%app.timezone%')] string $appTimezone,
    ) {
        $this->timezone = new \DateTimeZone($appTimezone);
    }

    public function process(string $rawCode, ?int $allowedEmployeeId = null): ScanResult
    {
        $code = strtoupper(trim($rawCode));

        if ('' === $code) {
            throw new UnknownQrCodeException();
        }

        $employee = $this->employeeRepository->findByActiveQrCode($code);

        if (!$employee) {
            throw new UnknownQrCodeException();
        }

        if (null !== $allowedEmployeeId && $employee->getId() !== $allowedEmployeeId) {
            throw new \RuntimeException('forbidden');
        }

        $now = new \DateTimeImmutable('now', $this->timezone);
        $openEntry = $this->timeEntryRepository->findOpenEntryForEmployee($employee);

        if ($openEntry) {
            $openEntry->close($now);
            $action = 'checked_out';
        } else {
            $this->entityManager->persist(new TimeEntry($employee, $now));
            $action = 'checked_in';
        }

        $this->entityManager->flush();
        $this->employeeRealtimePublisher->publishEmployeeUpdate($employee, [
            'id' => sprintf('%d-%s-%d', $employee->getId(), $action, $now->getTimestamp()),
            'type' => $action,
            'label' => 'checked_in' === $action ? 'Ingeklokt' : 'Uitgeklokt',
            'timestamp' => $now->format('c'),
            'location' => $employee->getLocation(),
            'employeeName' => $employee->getName(),
        ]);

        return new ScanResult($employee, $action, $now);
    }
}
