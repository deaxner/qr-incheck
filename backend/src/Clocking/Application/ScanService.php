<?php

namespace App\Clocking\Application;

use App\Clocking\Dto\ScanResult;
use App\Clocking\Exception\UnknownQrCodeException;
use App\Entity\TimeEntry;
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
        #[Autowire('%app.timezone%')] string $appTimezone,
    ) {
        $this->timezone = new \DateTimeZone($appTimezone);
    }

    public function process(string $rawCode): ScanResult
    {
        $code = strtoupper(trim($rawCode));

        if ('' === $code) {
            throw new UnknownQrCodeException();
        }

        $employee = $this->employeeRepository->findByActiveQrCode($code);

        if (!$employee) {
            throw new UnknownQrCodeException();
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

        return new ScanResult($employee, $action, $now);
    }
}
