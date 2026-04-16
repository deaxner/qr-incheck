<?php

namespace App\Auth\Http;

use App\Auth\Application\AuthContext;
use App\Auth\Application\DemoUserStore;
use App\Auth\Application\JwtService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class JwtAuthSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly DemoUserStore $demoUserStore,
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
