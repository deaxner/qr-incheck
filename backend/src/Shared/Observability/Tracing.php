<?php

namespace App\Shared\Observability;

use OpenTelemetry\API\Globals;
use OpenTelemetry\API\Trace\SpanInterface;

final class Tracing
{
    public function __construct(
        private readonly bool $enabled,
    ) {
    }

    /**
     * @param array<string, scalar|bool|null> $attributes
     */
    public function inSpan(string $name, callable $callback, array $attributes = []): mixed
    {
        $reflection = \is_array($callback)
            ? new \ReflectionMethod($callback[0], $callback[1])
            : new \ReflectionFunction(\Closure::fromCallable($callback));

        if (!$this->enabled) {
            if ($reflection->getNumberOfParameters() > 0) {
                return $callback(null);
            }

            return $callback();
        }

        $span = Globals::tracerProvider()
            ->getTracer('qr-incheck-backend')
            ->spanBuilder($name)
            ->startSpan();

        foreach ($attributes as $key => $value) {
            if ($value !== null) {
                $span->setAttribute($key, $value);
            }
        }

        $scope = $span->activate();
        try {
            if ($reflection->getNumberOfParameters() > 0) {
                return $callback($span);
            }

            return $callback();
        } catch (\Throwable $exception) {
            $span->recordException($exception);
            $span->setStatus(\OpenTelemetry\API\Trace\StatusCode::STATUS_ERROR, $exception->getMessage());

            throw $exception;
        } finally {
            $scope->detach();
            $span->end();
        }
    }
}
