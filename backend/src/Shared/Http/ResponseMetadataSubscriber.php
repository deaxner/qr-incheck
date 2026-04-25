<?php

namespace App\Shared\Http;

use App\Shared\Observability\MetricsCollector;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class ResponseMetadataSubscriber implements EventSubscriberInterface
{
    private const CONTRACT_VERSION = '2026-04';

    public function __construct(
        private readonly OperationalEventLogger $operationalEventLogger,
        private readonly MetricsCollector $metricsCollector,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $response = $event->getResponse();
        $durationMs = RequestContext::getDurationMs($request);
        $path = $request->getPathInfo();

        $response->headers->set('X-Contract-Version', self::CONTRACT_VERSION);
        $response->headers->set('X-Response-Time-Ms', (string) $durationMs);
        $this->metricsCollector->incrementCounter('qr_http_requests_total', [
            'method' => $request->getMethod(),
            'path' => $path,
            'status' => (string) $response->getStatusCode(),
        ]);
        $this->metricsCollector->setGauge('qr_http_response_time_ms', $durationMs, [
            'method' => $request->getMethod(),
            'path' => $path,
        ]);

        $route = $request->attributes->get('_route');

        if (!is_string($path) || (!str_starts_with($path, '/api/') && '/healthz' !== $path)) {
            return;
        }

        $this->operationalEventLogger->logHttp('http.request.completed', [
            'requestId' => RequestContext::getRequestId($request),
            'route' => is_string($route) ? $route : null,
            'method' => $request->getMethod(),
            'path' => $path,
            'statusCode' => $response->getStatusCode(),
            'durationMs' => $durationMs,
        ]);
    }
}
