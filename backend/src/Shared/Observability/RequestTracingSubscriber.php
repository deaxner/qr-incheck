<?php

namespace App\Shared\Observability;

use OpenTelemetry\API\Globals;
use OpenTelemetry\API\Trace\Span;
use OpenTelemetry\API\Trace\SpanKind;
use OpenTelemetry\API\Trace\StatusCode;
use OpenTelemetry\API\Trace\Propagation\TraceContextPropagator;
use OpenTelemetry\Context\Context;
use OpenTelemetry\Context\Propagation\ArrayAccessGetterSetter;
use OpenTelemetry\Context\ScopeInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class RequestTracingSubscriber implements EventSubscriberInterface
{
    private const SPAN_ATTRIBUTE = '_otel_request_span';
    private const SCOPE_ATTRIBUTE = '_otel_request_scope';

    public function __construct(
        private readonly bool $enabled,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 90],
            KernelEvents::EXCEPTION => ['onKernelException', 0],
            KernelEvents::RESPONSE => ['onKernelResponse', 90],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $headers = [];

        foreach ($request->headers->all() as $key => $values) {
            $headers[$key] = is_array($values) ? implode(',', $values) : (string) $values;
        }

        $parentContext = TraceContextPropagator::getInstance()->extract(
            $headers,
            ArrayAccessGetterSetter::getInstance(),
            Context::getCurrent(),
        );

        $path = $request->getPathInfo();
        $span = Globals::tracerProvider()
            ->getTracer('qr-incheck-backend')
            ->spanBuilder(sprintf('%s %s', $request->getMethod(), $path))
            ->setSpanKind(SpanKind::KIND_SERVER)
            ->setParent($parentContext)
            ->setAttribute('http.request.method', $request->getMethod())
            ->setAttribute('url.path', $path)
            ->startSpan();

        $scope = $span->activate();
        $request->attributes->set(self::SPAN_ATTRIBUTE, $span);
        $request->attributes->set(self::SCOPE_ATTRIBUTE, $scope);
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }

        $span = $this->getSpan($event->getRequest());

        if (null === $span) {
            return;
        }

        $exception = $event->getThrowable();
        $span->setStatus(StatusCode::STATUS_ERROR, $exception->getMessage());
        $span->recordException($exception);
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $response = $event->getResponse();
        $span = $this->getSpan($request);

        if (null === $span) {
            return;
        }

        $route = $request->attributes->get('_route');
        $statusCode = $response->getStatusCode();

        $span->setAttribute('http.response.status_code', $statusCode);

        if (is_string($route)) {
            $span->setAttribute('http.route', $route);
        }

        if ($statusCode >= 500) {
            $span->setStatus(StatusCode::STATUS_ERROR);
        } else {
            $span->setStatus(StatusCode::STATUS_OK);
        }

        $carrier = [];
        TraceContextPropagator::getInstance()->inject(
            $carrier,
            ArrayAccessGetterSetter::getInstance(),
            $span->storeInContext(Context::getCurrent()),
        );

        if (isset($carrier[TraceContextPropagator::TRACEPARENT])) {
            $response->headers->set('traceparent', (string) $carrier[TraceContextPropagator::TRACEPARENT]);
        }

        $response->headers->set('X-Trace-Id', $span->getContext()->getTraceId());

        $scope = $request->attributes->get(self::SCOPE_ATTRIBUTE);

        if ($scope instanceof ScopeInterface) {
            $scope->detach();
        }

        $span->end();
    }

    private function getSpan(\Symfony\Component\HttpFoundation\Request $request): ?\OpenTelemetry\API\Trace\SpanInterface
    {
        $span = $request->attributes->get(self::SPAN_ATTRIBUTE);

        return $span instanceof \OpenTelemetry\API\Trace\SpanInterface ? $span : null;
    }
}
