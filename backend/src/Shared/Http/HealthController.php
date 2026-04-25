<?php

namespace App\Shared\Http;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController extends AbstractController
{
    public function __construct(
        private readonly Connection $connection,
    ) {
    }

    #[Route('/healthz', name: 'healthz', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $databaseStatus = 'down';

        try {
            $this->connection->executeQuery('SELECT 1');
            $databaseStatus = 'up';
        } catch (\Throwable) {
            return $this->json((new OperationalStatusView(
                'degraded',
                'qr-incheck-backend',
                (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format(DATE_ATOM),
                RequestContext::getRequestId($request),
                [
                    'database' => ['status' => $databaseStatus],
                    'realtime' => [
                        'status' => 'configured',
                        'enabled' => (bool) ($_ENV['APP_REALTIME_ENABLED'] ?? false),
                    ],
                ],
            ))->toArray(), 503);
        }

        return $this->json((new OperationalStatusView(
            'ok',
            'qr-incheck-backend',
            (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format(DATE_ATOM),
            RequestContext::getRequestId($request),
            [
                'database' => ['status' => $databaseStatus],
                'realtime' => [
                    'status' => 'configured',
                    'enabled' => (bool) ($_ENV['APP_REALTIME_ENABLED'] ?? false),
                ],
            ],
        ))->toArray());
    }
}
