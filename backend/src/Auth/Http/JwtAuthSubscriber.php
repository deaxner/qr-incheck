<?php

namespace App\Auth\Http;

use App\Auth\Application\AuthContext;
use App\Auth\Application\DemoUserStore;
use App\Auth\Application\JwtService;
use App\Auth\Application\ScannerDeviceTokenService;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class JwtAuthSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly DemoUserStore $demoUserStore,
        private readonly ScannerDeviceTokenService $scannerDeviceTokenService,
        private readonly RateLimiterFactory $scanRequestLimiter,
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
                $event->setResponse(new JsonResponse([
                    'code' => 'invalid_device_token',
                    'message' => 'Scanner device token ontbreekt.',
                ], 401));

                return;
            }

            if (!$this->scannerDeviceTokenService->isValid($deviceToken)) {
                $event->setResponse(new JsonResponse([
                    'code' => 'invalid_device_token',
                    'message' => 'Scanner device token is ongeldig.',
                ], 401));

                return;
            }

            $limit = $this->scanRequestLimiter->create(trim($deviceToken))->consume(1);

            if (!$limit->isAccepted()) {
                $event->setResponse(new JsonResponse([
                    'code' => 'rate_limited',
                    'message' => 'Er worden te veel scans tegelijk verwerkt. Probeer het zo opnieuw.',
                ], 429));

                return;
            }

            return;
        }

        $authorization = $request->headers->get('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            $event->setResponse(new JsonResponse([
                'code' => 'unauthorized',
                'message' => 'Authenticatie ontbreekt.',
            ], 401));

            return;
        }

        $token = substr($authorization, 7);
        $payload = $this->jwtService->decode($token);

        if (!$payload || !isset($payload['sub'])) {
            $event->setResponse(new JsonResponse([
                'code' => 'unauthorized',
                'message' => 'Ongeldig of verlopen token.',
            ], 401));

            return;
        }

        $user = $this->demoUserStore->findById((string) $payload['sub']);

        if (!$user) {
            $event->setResponse(new JsonResponse([
                'code' => 'unauthorized',
                'message' => 'Onbekende gebruiker.',
            ], 401));

            return;
        }

        $request->attributes->set(AuthContext::REQUEST_ATTRIBUTE, $user);
    }
}
