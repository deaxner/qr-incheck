<?php

namespace App\Employees\Application;

use App\Employees\Domain\QrCodeGenerator;
use App\Entity\Employee;
use Doctrine\ORM\EntityManagerInterface;

class QrCodeRotationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly QrCodeGenerator $qrCodeGenerator,
    ) {
    }

    public function rotate(Employee $employee): Employee
    {
        $employee->rotateQrCode($this->qrCodeGenerator->generate());
        $this->entityManager->flush();

        return $employee;
    }
}
