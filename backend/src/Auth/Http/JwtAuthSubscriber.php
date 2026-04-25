<?php

namespace App\Auth\Http;

use App\Auth\Application\AuthContext;
use App\Auth\Application\DemoUserStore;
use App\Auth\Application\JwtService;
use App\Auth\Application\ScannerDeviceTokenService;
use App\Shared\Http\ApiProblemResponseFactory;
use App\Shared\Http\OperationalEventLogger;
use App\Shared\Http\RequestContext;
use App\Shared\Observability\MetricsCollector;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class JwtAuthSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly DemoUserStore $demoUserStore,
        private readonly ScannerDeviceTokenService $scannerDeviceTokenService,
        private readonly RateLimiterFactory $scanRequestLimiter,
        private readonly ApiProblemResponseFactory $apiProblemResponseFactory,
        private readonly OperationalEventLogger $operationalEventLogger,
        private readonly MetricsCollector $metricsCollector,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api/') || '/api/auth/login' === $path) {
            return;
        }

        if ('/api/scan' === $path) {
            $deviceToken = $request->headers->get('X-DEVICE-TOKEN');

            if (null === $deviceToken || '' === trim($deviceToken)) {
                $this->operationalEventLogger->logSecurity('scan.request.rejected', [
                    'requestId' => RequestContext::getRequestId($request),
                    'reason' => 'missing_device_token',
                ]);
                $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => 'invalid_device_token']);

                $event->setResponse($this->apiProblemResponseFactory->create(
                    $request,
                    'invalid_device_token',
                    'Scanner device token ontbreekt.',
                    401,
                ));

                return;
            }

            if (!$this->scannerDeviceTokenService->isValid($deviceToken)) {
                $this->operationalEventLogger->logSecurity('scan.request.rejected', [
                    'requestId' => RequestContext::getRequestId($request),
                    'reason' => 'invalid_device_token',
                ]);
                $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => 'invalid_device_token']);

                $event->setResponse($this->apiProblemResponseFactory->create(
                    $request,
                    'invalid_device_token',
                    'Scanner device token is ongeldig.',
                    401,
                ));

                return;
            }

            $limit = $this->scanRequestLimiter->create(trim($deviceToken))->consume(1);

            if (!$limit->isAccepted()) {
                $this->operationalEventLogger->logSecurity('scan.request.throttled', [
                    'requestId' => RequestContext::getRequestId($request),
                    'reason' => 'device_rate_limited',
                ]);
                $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => 'rate_limited']);

                $event->setResponse($this->apiProblemResponseFactory->create(
                    $request,
                    'rate_limited',
                    'Er worden te veel scans tegelijk verwerkt. Probeer het zo opnieuw.',
                    429,
                ));

                return;
            }

            return;
        }

        $authorization = $request->headers->get('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            $this->operationalEventLogger->logSecurity('auth.request.rejected', [
                'requestId' => RequestContext::getRequestId($request),
                'reason' => 'missing_bearer_token',
                'path' => $path,
            ]);

            $event->setResponse($this->apiProblemResponseFactory->create(
                $request,
                'unauthorized',
                'Authenticatie ontbreekt.',
                401,
            ));

            return;
        }

        $token = substr($authorization, 7);
        $payload = $this->jwtService->decode($token);

        if (!$payload || !isset($payload['sub'])) {
            $this->operationalEventLogger->logSecurity('auth.request.rejected', [
                'requestId' => RequestContext::getRequestId($request),
                'reason' => 'invalid_or_expired_token',
                'path' => $path,
            ]);

            $event->setResponse($this->apiProblemResponseFactory->create(
                $request,
                'unauthorized',
                'Ongeldig of verlopen token.',
                401,
            ));

            return;
        }

        $user = $this->demoUserStore->findById((string) $payload['sub']);

        if (!$user) {
            $this->operationalEventLogger->logSecurity('auth.request.rejected', [
                'requestId' => RequestContext::getRequestId($request),
                'reason' => 'unknown_user',
                'path' => $path,
            ]);

            $event->setResponse($this->apiProblemResponseFactory->create(
                $request,
                'unauthorized',
                'Onbekende gebruiker.',
                401,
            ));

            return;
        }

        $request->attributes->set(AuthContext::REQUEST_ATTRIBUTE, $user);
    }
}
