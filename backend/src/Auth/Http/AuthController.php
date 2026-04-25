<?php

namespace App\Auth\Http;

use App\Auth\Application\AuthenticatedEmployeeViewService;
use App\Auth\Application\AuthContext;
use App\Auth\Application\DemoUserStore;
use App\Auth\Application\JwtService;
use App\Auth\Dto\AuthLoginResponseView;
use App\Auth\Dto\AuthUserView;
use App\Shared\Http\ApiProblemResponseFactory;
use App\Shared\Http\OperationalEventLogger;
use App\Shared\Http\RequestContext;
use App\Shared\Observability\MetricsCollector;
use JsonException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly ApiProblemResponseFactory $apiProblemResponseFactory,
        private readonly OperationalEventLogger $operationalEventLogger,
        private readonly MetricsCollector $metricsCollector,
    ) {
    }

    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(Request $request, DemoUserStore $demoUserStore, JwtService $jwtService): JsonResponse
    {
        try {
            $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            $this->operationalEventLogger->logSecurity('auth.login.rejected', [
                'requestId' => RequestContext::getRequestId($request),
                'reason' => 'malformed_json',
            ]);
            $this->metricsCollector->incrementCounter('qr_auth_login_attempts_total', ['outcome' => 'invalid_request']);

            return $this->apiProblemResponseFactory->create(
                $request,
                'invalid_request',
                'Voer een geldig e-mailadres en wachtwoord in.',
                400,
            );
        }

        $email = is_array($payload) ? ($payload['email'] ?? '') : '';
        $password = is_array($payload) ? ($payload['password'] ?? '') : '';

        if (!is_string($email) || !is_string($password) || '' === trim($email) || '' === trim($password)) {
            $this->operationalEventLogger->logSecurity('auth.login.rejected', [
                'requestId' => RequestContext::getRequestId($request),
                'reason' => 'missing_credentials',
            ]);
            $this->metricsCollector->incrementCounter('qr_auth_login_attempts_total', ['outcome' => 'invalid_request']);

            return $this->apiProblemResponseFactory->create(
                $request,
                'invalid_request',
                'Voer een geldig e-mailadres en wachtwoord in.',
                400,
            );
        }

        $user = $demoUserStore->authenticate($email, $password);

        if (!$user) {
            $this->operationalEventLogger->logSecurity('auth.login.rejected', [
                'requestId' => RequestContext::getRequestId($request),
                'reason' => 'invalid_credentials',
                'email' => is_string($email) ? trim(strtolower($email)) : null,
            ]);
            $this->metricsCollector->incrementCounter('qr_auth_login_attempts_total', ['outcome' => 'invalid_credentials']);

            return $this->apiProblemResponseFactory->create(
                $request,
                'invalid_credentials',
                'Onjuiste inloggegevens.',
                401,
            );
        }

        $token = $jwtService->encode([
            'sub' => $user->id,
            'role' => $user->role,
            'employeeId' => $user->employeeId,
            'exp' => time() + 60 * 60 * 8,
        ]);

        $this->operationalEventLogger->logSecurity('auth.login.succeeded', [
            'requestId' => RequestContext::getRequestId($request),
            'userId' => $user->id,
            'role' => $user->role,
        ]);
        $this->metricsCollector->incrementCounter('qr_auth_login_attempts_total', ['outcome' => 'success']);

        return $this->json((new AuthLoginResponseView(
            $token,
            AuthUserView::fromAuthUser($user),
        ))->toArray());
    }

    #[Route('/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(
        Request $request,
        AuthContext $authContext,
        AuthenticatedEmployeeViewService $authenticatedEmployeeViewService,
    ): JsonResponse {
        $user = $authContext->requireUser($request);

        return $this->json($authenticatedEmployeeViewService->build($user)->toArray());
    }
}
