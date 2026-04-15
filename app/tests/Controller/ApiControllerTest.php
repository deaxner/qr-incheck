<?php

namespace App\Tests\Controller;

use App\Entity\Employee;
use App\Tests\Support\RefreshDatabaseTrait;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ApiControllerTest extends WebTestCase
{
    use RefreshDatabaseTrait;

    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        self::bootKernel();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $this->resetDatabase($this->entityManager);
    }

    public function testScanEndpointHandlesCheckInAndCheckOut(): void
    {
        $this->createEmployee('Alice', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/scan', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'code' => 'ALICE-DEMO-001',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();
        self::assertSame('checked_in', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['action']);

        $client->request('POST', '/api/scan', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'code' => 'ALICE-DEMO-001',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();
        self::assertSame('checked_out', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['action']);
    }

    public function testScanEndpointReturnsExpectedErrorForUnknownCode(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/scan', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'code' => 'UNKNOWN-CODE',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(404);
        self::assertSame('unknown_qr_code', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testRegenerateQrCodeEndpointReturnsNewCode(): void
    {
        $employee = $this->createEmployee('Bob', 'BOB-DEMO-002');
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', sprintf('/api/employees/%d/regenerate-qr', $employee->getId()));

        self::assertResponseIsSuccessful();
        self::assertNotSame('BOB-DEMO-002', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['employee']['qrCode']);
    }

    private function createEmployee(string $name, string $qrCode): Employee
    {
        $employee = new Employee($name, $qrCode);
        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        return $employee;
    }
}
