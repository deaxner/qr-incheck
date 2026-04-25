<?php

namespace App\Employees\Application;

use App\Employees\Domain\QrCodeGenerator;
use App\Entity\Employee;
use App\Realtime\Application\EmployeeRealtimePublisher;
use App\Shared\Observability\Tracing;
use Doctrine\ORM\EntityManagerInterface;

class QrCodeRotationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly QrCodeGenerator $qrCodeGenerator,
        private readonly EmployeeRealtimePublisher $employeeRealtimePublisher,
        private readonly Tracing $tracing,
    ) {
    }

    public function rotate(Employee $employee): Employee
    {
        return $this->tracing->inSpan('employee.badge.rotate', function () use ($employee): Employee {
            $employee->rotateQrCode($this->qrCodeGenerator->generate());
            $this->entityManager->flush();
            $this->employeeRealtimePublisher->publishEmployeeUpdate($employee, [
                'id' => sprintf('%d-badge-regenerated-%d', $employee->getId(), time()),
                'type' => 'badge_regenerated',
                'label' => 'Badge vernieuwd',
                'timestamp' => (new \DateTimeImmutable())->format('c'),
                'location' => $employee->getLocation(),
                'employeeName' => $employee->getName(),
                'qrCode' => $employee->getQrCode(),
            ]);

            return $employee;
        }, [
            'employee.id' => $employee->getId(),
        ]);
    }
}
