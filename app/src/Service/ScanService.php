<?php

namespace App\Service;

use App\Dto\ScanResult;
use App\Entity\TimeEntry;
use App\Exception\UnknownQrCodeException;
use App\Repository\EmployeeRepository;
use App\Repository\TimeEntryRepository;
use Doctrine\ORM\EntityManagerInterface;

class ScanService
{
    public function __construct(
        private readonly EmployeeRepository $employeeRepository,
        private readonly TimeEntryRepository $timeEntryRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
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

        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
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
