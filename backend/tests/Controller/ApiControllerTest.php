<?php

namespace App\Tests\Controller;

use App\Entity\Employee;
use App\Tests\Support\RefreshDatabaseTrait;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ApiControllerTest extends WebTestCase
{
    use RefreshDatabaseTrait;

    private const SCANNER_DEVICE_TOKEN = 'scanner-demo-token';

    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        self::bootKernel();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $rateLimiterCache = static::getContainer()->get('cache.rate_limiter');
        $appCache = static::getContainer()->get('cache.app');

        if ($rateLimiterCache instanceof CacheItemPoolInterface) {
            $rateLimiterCache->clear();
        }

        if ($appCache instanceof CacheItemPoolInterface) {
            $appCache->clear();
        }

        $this->resetDatabase($this->entityManager);
    }

    public function testLoginReturnsTokenAndUserPayload(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'bob.admin@timesignal.demo',
            'password' => 'Admin123!',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertArrayHasKey('token', $payload);
        self::assertArrayNotHasKey('authChoice', $payload);
        self::assertSame('bob.admin@timesignal.demo', $payload['user']['email']);
        self::assertSame('admin', $payload['user']['role']);
        self::assertNotEmpty($client->getResponse()->headers->get('X-Request-Id'));
        self::assertSame('2026-04', $client->getResponse()->headers->get('X-Contract-Version'));
        self::assertNotEmpty($client->getResponse()->headers->get('X-Response-Time-Ms'));
    }

    public function testLoginRejectsInvalidCredentials(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'bob.admin@timesignal.demo',
            'password' => 'WrongPassword!',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(401);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('invalid_credentials', $payload['code']);
        self::assertSame($client->getResponse()->headers->get('X-Request-Id'), $payload['requestId']);
    }

    public function testLoginRejectsMalformedJson(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: '{"email":');

        self::assertResponseStatusCodeSame(400);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('invalid_request', $payload['code']);
        self::assertArrayHasKey('requestId', $payload);
    }

    public function testProtectedEndpointRejectsMissingToken(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('GET', '/api/employees');

        self::assertResponseStatusCodeSame(401);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('unauthorized', $payload['code']);
        self::assertSame($client->getResponse()->headers->get('X-Request-Id'), $payload['requestId']);
    }

    public function testAuthenticatedUserEndpointReturnsCurrentUser(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        $this->createEmployee('Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby');

        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient();

        $client->request('GET', '/api/auth/me');

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('bob.admin@timesignal.demo', $payload['user']['email']);
        self::assertSame('Bob de Vries', $payload['employee']['name']);
        self::assertSame('North Lobby', $payload['employee']['profile']['location']);
        self::assertSame('2026-04', $client->getResponse()->headers->get('X-Contract-Version'));
    }

    public function testEmployeeUserCannotViewTeamOverview(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        $this->createEmployee('Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient('alice@timesignal.demo', 'User123!');

        $client->request('GET', '/api/employees');

        self::assertResponseStatusCodeSame(403);
        self::assertSame('forbidden', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testEmployeeUserCannotViewAnotherEmployeesHistory(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        $bob = $this->createEmployee('Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient('alice@timesignal.demo', 'User123!');

        $client->request('GET', sprintf('/api/employees/%d/history', $bob->getId()));

        self::assertResponseStatusCodeSame(403);
        self::assertSame('forbidden', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testEmployeeUserCannotRegenerateBadge(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        $bob = $this->createEmployee('Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient('alice@timesignal.demo', 'User123!');

        $client->request('POST', sprintf('/api/employees/%d/regenerate-qr', $bob->getId()));

        self::assertResponseStatusCodeSame(403);
        self::assertSame('forbidden', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testEmployeesCannotUseScanEndpointWithJwtOnly(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        $this->createEmployee('Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient('alice@timesignal.demo', 'User123!');

        $client->request('POST', '/api/scan', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'code' => 'BOB-DEMO-002',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(401);
        self::assertSame('invalid_device_token', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testScanEndpointHandlesCheckInAndCheckOutWithDeviceToken(): void
    {
        $this->createEmployee('Alice', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = static::createClient();

        $this->requestScan($client, 'ALICE-DEMO-001');

        self::assertResponseIsSuccessful();
        self::assertSame('checked_in', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['action']);

        $this->requestScan($client, 'ALICE-DEMO-001');

        self::assertResponseIsSuccessful();
        self::assertSame('checked_out', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['action']);
    }

    public function testScanEndpointRejectsMissingDeviceToken(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/scan', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'code' => 'ALICE-DEMO-001',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(401);
        self::assertSame('invalid_device_token', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testScanEndpointRejectsInvalidDeviceToken(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/scan', server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_DEVICE_TOKEN' => 'wrong-token',
        ], content: json_encode([
            'code' => 'ALICE-DEMO-001',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseStatusCodeSame(401);
        self::assertSame('invalid_device_token', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testScanEndpointRejectsMalformedJson(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/scan', server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_DEVICE_TOKEN' => self::SCANNER_DEVICE_TOKEN,
        ], content: '{"code":');

        self::assertResponseStatusCodeSame(400);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('invalid_request', $payload['code']);
        self::assertSame($client->getResponse()->headers->get('X-Request-Id'), $payload['requestId']);
    }

    public function testScanEndpointRejectsBlankCode(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $this->requestScan($client, '   ');

        self::assertResponseStatusCodeSame(400);
        self::assertSame('invalid_request', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testScanEndpointReturnsExpectedErrorForUnknownCode(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $this->requestScan($client, 'UNKNOWN-CODE');

        self::assertResponseStatusCodeSame(404);
        self::assertSame('unknown_qr_code', json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['code']);
    }

    public function testScanEndpointRateLimitsBurstRequestsPerDevice(): void
    {
        $this->createEmployee('Alice', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = static::createClient();

        for ($attempt = 0; $attempt < 6; ++$attempt) {
            $this->requestScan($client, 'ALICE-DEMO-001');
            self::assertResponseIsSuccessful();
        }

        $this->requestScan($client, 'ALICE-DEMO-001');

        self::assertResponseStatusCodeSame(429);
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('rate_limited', $payload['code']);
        self::assertSame($client->getResponse()->headers->get('X-Request-Id'), $payload['requestId']);
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

        $this->requestScan($client, 'ALICE-DEMO-001');

        $client->request('GET', sprintf('/api/employees/%d/history', $employee->getId()));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Product Engineering', $payload['employee']['profile']['department']);
        self::assertCount(1, $payload['entries']);
        self::assertSame('checked_in', $payload['entries'][0]['action']);
    }

    public function testEmployeeSelfStatusEndpointReturnsCurrentStatus(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient('alice@timesignal.demo', 'User123!');

        $this->requestScan($client, 'ALICE-DEMO-001');

        $client->request('GET', '/api/employees/me/status');

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('IN', $payload['status']);
        self::assertNotNull($payload['lastClock']);
    }

    public function testEmployeeSelfHistoryEndpointReturnsOwnHistory(): void
    {
        $this->createEmployee('Alice Janssen', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = $this->createAuthenticatedClient('alice@timesignal.demo', 'User123!');

        $this->requestScan($client, 'ALICE-DEMO-001');
        $client->request('GET', '/api/employees/me/history');

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Alice Janssen', $payload['employee']['name']);
        self::assertCount(1, $payload['entries']);
        self::assertSame('checked_in', $payload['entries'][0]['action']);
    }

    public function testHealthEndpointReturnsOperationalStatus(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('GET', '/healthz');

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('ok', $payload['status']);
        self::assertSame('up', $payload['dependencies']['database']['status']);
        self::assertArrayHasKey('requestId', $payload);
    }

    public function testResponsesExposeSecurityHeaders(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('GET', '/healthz');

        self::assertResponseIsSuccessful();
        self::assertSame('nosniff', $client->getResponse()->headers->get('X-Content-Type-Options'));
        self::assertSame('DENY', $client->getResponse()->headers->get('X-Frame-Options'));
        self::assertSame('no-referrer', $client->getResponse()->headers->get('Referrer-Policy'));
        self::assertNotEmpty($client->getResponse()->headers->get('Content-Security-Policy'));
        self::assertSame('2026-04', $client->getResponse()->headers->get('X-Contract-Version'));
        self::assertGreaterThanOrEqual(0, (int) $client->getResponse()->headers->get('X-Response-Time-Ms'));
    }

    public function testMetricsEndpointExportsOperationalCounters(): void
    {
        $this->createEmployee('Alice', 'ALICE-DEMO-001');
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'bob.admin@timesignal.demo',
            'password' => 'Admin123!',
        ], JSON_THROW_ON_ERROR));
        $this->requestScan($client, 'ALICE-DEMO-001');
        $client->request('GET', '/metrics');

        self::assertResponseIsSuccessful();
        self::assertStringContainsString('# TYPE qr_auth_login_attempts_total counter', $client->getResponse()->getContent());
        self::assertStringContainsString('qr_auth_login_attempts_total{outcome="success"} 1', $client->getResponse()->getContent());
        self::assertStringContainsString('qr_scan_requests_total{outcome="checked_in"} 1', $client->getResponse()->getContent());
        self::assertStringContainsString('# TYPE qr_http_requests_total counter', $client->getResponse()->getContent());
    }

    public function testLoginContractShapeRemainsStable(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'bob.admin@timesignal.demo',
            'password' => 'Admin123!',
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['token', 'user'], array_keys($payload));
        self::assertSame(['id', 'email', 'name', 'role', 'employeeId'], array_keys($payload['user']));
    }

    private function createEmployee(
        string $name,
        string $qrCode,
        string $department = 'Product Engineering',
        string $employmentType = 'Full-time',
        string $location = 'Main Entrance',
    ): Employee
    {
        $employee = new Employee($name, $qrCode, $department, $employmentType, $location);
        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        return $employee;
    }

    private function createAuthenticatedClient(
        string $email = 'bob.admin@timesignal.demo',
        string $password = 'Admin123!',
    ): object
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => $email,
            'password' => $password,
        ], JSON_THROW_ON_ERROR));

        self::assertResponseIsSuccessful();

        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $client->setServerParameter('HTTP_AUTHORIZATION', sprintf('Bearer %s', $payload['token']));

        return $client;
    }

    private function requestScan(object $client, string $code): void
    {
        $client->request('POST', '/api/scan', server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_DEVICE_TOKEN' => self::SCANNER_DEVICE_TOKEN,
        ], content: json_encode([
            'code' => $code,
        ], JSON_THROW_ON_ERROR));
    }
}
