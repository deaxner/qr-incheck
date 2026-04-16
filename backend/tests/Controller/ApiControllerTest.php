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
        $client = $this->createAuthenticatedClient();

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
        $client = $this->createAuthenticatedClient();

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
        $client = $this->createAuthenticatedClient();

        $client->request('POST', sprintf('/api/employees/%d/regenerate-qr', $employee->getId()));

        self::assertResponseIsSuccessful();
        self::assertNotSame('BOB-DEMO-002', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['employee']['qrCode']);
    }

    public function testEmployeeHistoryEndpointReturnsOwnedHistory(): void
    {
        $employee = $this->createEmployee('Alice', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient();

        $client->request('POST', '/api/scan', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'code' => 'ALICE-DEMO-001',
        ], JSON_THROW_ON_ERROR));

        $client->request('GET', sprintf('/api/employees/%d/history', $employee->getId()));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Product Engineering', $payload['employee']['profile']['department']);
        self::assertCount(1, $payload['entries']);
        self::assertSame('checked_in', $payload['entries'][0]['action']);
    }

    private function createEmployee(string $name, string $qrCode): Employee
    {
        $employee = new Employee($name, $qrCode, 'Product Engineering', 'Full-time', 'Main Entrance');
        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        return $employee;
    }

    private function createAuthenticatedClient(): object
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'bob.admin@timesignal.demo',
            'password' => 'Admin123!',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();

        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $client->setServerParameter('HTTP_AUTHORIZATION', sprintf('Bearer %s', $payload['token']));

        return $client;
    }
}
