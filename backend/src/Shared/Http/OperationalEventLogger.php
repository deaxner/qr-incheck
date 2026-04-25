<?php

namespace App\Shared\Http;

use Psr\Log\LoggerInterface;

final class OperationalEventLogger
{
    public function __construct(
        private readonly bool $enabled,
        private readonly LoggerInterface $httpLogger,
        private readonly LoggerInterface $securityLogger,
        private readonly LoggerInterface $auditLogger,
    ) {
    }

    /**
     * @param array<string, scalar|array|null> $context
     */
    public function logHttp(string $eventType, array $context = []): void
    {
        $this->log($this->httpLogger, $eventType, $context);
    }

    /**
     * @param array<string, scalar|array|null> $context
     */
    public function logSecurity(string $eventType, array $context = []): void
    {
        $this->log($this->securityLogger, $eventType, $context);
    }

    /**
     * @param array<string, scalar|array|null> $context
     */
    public function logAudit(string $eventType, array $context = []): void
    {
        $this->log($this->auditLogger, $eventType, $context);
    }

    /**
     * @param array<string, scalar|array|null> $context
     */
    private function log(LoggerInterface $logger, string $eventType, array $context): void
    {
        if (!$this->enabled) {
            return;
        }

        $logger->info($eventType, [
            'eventType' => $eventType,
            'timestamp' => (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format(DATE_ATOM),
            'context' => $context,
        ]);
    }
}
