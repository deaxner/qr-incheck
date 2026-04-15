<?php

namespace App\Controller\Api;

use App\Repository\EmployeeRepository;
use App\Service\EmployeeOverviewService;
use App\Service\QrCodeRotationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/employees')]
class EmployeeController extends AbstractController
{
    #[Route('', name: 'api_employees_index', methods: ['GET'])]
    public function index(EmployeeOverviewService $employeeOverviewService): JsonResponse
    {
        return $this->json($employeeOverviewService->getOverview());
    }

    #[Route('/{id}/regenerate-qr', name: 'api_employees_regenerate_qr', methods: ['POST'])]
    public function regenerateQrCode(
        int $id,
        EmployeeRepository $employeeRepository,
        QrCodeRotationService $qrCodeRotationService,
    ): JsonResponse {
        $employee = $employeeRepository->find($id);

        if (!$employee) {
            return $this->json([
                'code' => 'employee_not_found',
                'message' => 'Medewerker niet gevonden.',
            ], 404);
        }

        $employee = $qrCodeRotationService->rotate($employee);

        return $this->json([
            'employee' => [
                'id' => $employee->getId(),
                'name' => $employee->getName(),
                'qrCode' => $employee->getQrCode(),
            ],
        ]);
    }
}
