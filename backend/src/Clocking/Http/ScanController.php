<?php

namespace App\Clocking\Http;

use App\Auth\Application\AuthContext;
use App\Clocking\Application\ScanService;
use App\Clocking\Exception\UnknownQrCodeException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ScanController extends AbstractController
{
    #[Route('/api/scan', name: 'api_scan', methods: ['POST'])]
    public function __invoke(Request $request, ScanService $scanService, AuthContext $authContext): JsonResponse
    {
        $user = $authContext->requireUser($request);
        $payload = json_decode($request->getContent(), true);
        $code = is_array($payload) ? ($payload['code'] ?? '') : '';

        if (!is_string($code) || '' === trim($code)) {
            return $this->json([
                'code' => 'invalid_request',
                'message' => 'Voer een geldige QR-code in.',
            ], 400);
        }

        try {
            $result = $scanService->process($code, $user->isAdmin() ? null : $user->employeeId);
        } catch (UnknownQrCodeException $exception) {
            return $this->json([
                'code' => 'unknown_qr_code',
                'message' => $exception->getMessage(),
            ], 404);
        } catch (\RuntimeException $exception) {
            if ('forbidden' !== $exception->getMessage()) {
                throw $exception;
            }

            return $this->json([
                'code' => 'forbidden',
                'message' => 'Je mag alleen je eigen badge gebruiken.',
            ], 403);
        }

        return $this->json([
            'action' => $result->action,
            'timestamp' => $result->timestamp->format('Y-m-d H:i:s T'),
            'employee' => [
                'id' => $result->employee->getId(),
                'name' => $result->employee->getName(),
                'qrCode' => $result->employee->getQrCode(),
                'profile' => [
                    'department' => $result->employee->getDepartment(),
                    'employmentType' => $result->employee->getEmploymentType(),
                    'location' => $result->employee->getLocation(),
                ],
            ],
        ]);
    }
}
