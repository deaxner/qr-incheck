<?php

namespace App\Auth\Http;

use App\Auth\Application\AuthenticatedEmployeeViewService;
use App\Auth\Application\AuthContext;
use App\Auth\Application\DemoUserStore;
use App\Auth\Application\JwtService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(Request $request, DemoUserStore $demoUserStore, JwtService $jwtService): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        $email = is_array($payload) ? ($payload['email'] ?? '') : '';
        $password = is_array($payload) ? ($payload['password'] ?? '') : '';

        if (!is_string($email) || !is_string($password) || '' === trim($email) || '' === trim($password)) {
            return $this->json([
                'code' => 'invalid_request',
                'message' => 'Voer een geldig e-mailadres en wachtwoord in.',
            ], 400);
        }

        $user = $demoUserStore->authenticate($email, $password);

        if (!$user) {
            return $this->json([
                'code' => 'invalid_credentials',
                'message' => 'Onjuiste inloggegevens.',
            ], 401);
        }

        $token = $jwtService->encode([
            'sub' => $user->id,
            'role' => $user->role,
            'employeeId' => $user->employeeId,
            'exp' => time() + 60 * 60 * 8,
        ]);

        return $this->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'employeeId' => $user->employeeId,
            ],
            'authChoice' => 'Demo-auth met JWT is hier bewust gekozen. Het laat rolgestuurde toegang en API-bescherming zien zonder de scope op te blazen met SSO-integraties.',
        ]);
    }

    #[Route('/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(
        Request $request,
        AuthContext $authContext,
        AuthenticatedEmployeeViewService $authenticatedEmployeeViewService,
    ): JsonResponse {
        $user = $authContext->requireUser($request);

        return $this->json($authenticatedEmployeeViewService->build($user));
    }
}
