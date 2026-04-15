<?php

namespace App\Tests\Service;

use App\Entity\Employee;
use App\Repository\TimeEntryRepository;
use App\Service\ScanService;
use App\Tests\Support\RefreshDatabaseTrait;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class ScanServiceTest extends KernelTestCase
{
    use RefreshDatabaseTrait;

    private EntityManagerInterface $entityManager;
    private ScanService $scanService;
    private TimeEntryRepository $timeEntryRepository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $this->resetDatabase($this->entityManager);
        $this->scanService = static::getContainer()->get(ScanService::class);
        $this->timeEntryRepository = static::getContainer()->get(TimeEntryRepository::class);
    }

    public function testFirstValidScanCreatesOpenEntry(): void
    {
        $employee = $this->createEmployee('Alice', 'ALICE-DEMO-001');

        $result = $this->scanService->process('ALICE-DEMO-001');

        self::assertSame('checked_in', $result->action);
        self::assertNotNull($this->timeEntryRepository->findOpenEntryForEmployee($employee));
    }

    public function testSecondValidScanClosesOpenEntry(): void
    {
        $employee = $this->createEmployee('Bob', 'BOB-DEMO-002');

        $this->scanService->process('BOB-DEMO-002');
        $result = $this->scanService->process('BOB-DEMO-002');

        self::assertSame('checked_out', $result->action);
        self::assertNull($this->timeEntryRepository->findOpenEntryForEmployee($employee));
    }

    public function testUnknownCodeIsRejected(): void
    {
        $this->expectException(\RuntimeException::class);

        $this->scanService->process('UNKNOWN-CODE');
    }

    public function testRotatedOldCodeStopsWorking(): void
    {
        $employee = $this->createEmployee('Charlie', 'CHARLIE-DEMO-003');
        $employee->rotateQrCode('CHARLIE-DEMO-999');
        $this->entityManager->flush();

        $this->expectException(\RuntimeException::class);
        $this->scanService->process('CHARLIE-DEMO-003');
    }

    private function createEmployee(string $name, string $qrCode): Employee
    {
        $employee = new Employee($name, $qrCode);
        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        return $employee;
    }
}
