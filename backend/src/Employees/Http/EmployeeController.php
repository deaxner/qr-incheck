<?php

namespace App\Employees\Http;

use App\Auth\Application\AuthContext;
use App\Employees\Application\EmployeeHistoryService;
use App\Employees\Application\EmployeeOverviewService;
use App\Employees\Application\QrCodeRotationService;
use App\Repository\EmployeeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/employees')]
class EmployeeController extends AbstractController
{
    #[Route('', name: 'api_employees_index', methods: ['GET'])]
    public function index(
        \Symfony\Component\HttpFoundation\Request $request,
        EmployeeOverviewService $employeeOverviewService,
        AuthContext $authContext,
    ): JsonResponse
    {
        $user = $authContext->requireUser($request);
        $overview = $employeeOverviewService->getOverview();

        if (!$user->isAdmin()) {
            $overview = array_values(array_filter(
                $overview,
                static fn (array $employee): bool => $employee['id'] === $user->employeeId
            ));
        }

        return $this->json($overview);
    }

    #[Route('/{id}/history', name: 'api_employees_history', methods: ['GET'])]
    public function history(
        \Symfony\Component\HttpFoundation\Request $request,
        int $id,
        EmployeeRepository $employeeRepository,
        EmployeeHistoryService $employeeHistoryService,
        AuthContext $authContext,
    ): JsonResponse {
        try {
            $authContext->ensureCanAccessEmployee($request, $id);
        } catch (\RuntimeException $exception) {
            if ('forbidden' !== $exception->getMessage()) {
                throw $exception;
            }

            return $this->json([
                'code' => 'forbidden',
                'message' => 'Je hebt geen toegang tot deze medewerkerhistorie.',
            ], 403);
        }

        $employee = $employeeRepository->find($id);

        if (!$employee) {
            return $this->json([
                'code' => 'employee_not_found',
                'message' => 'Medewerker niet gevonden.',
            ], 404);
        }

        return $this->json($employeeHistoryService->getForEmployee($employee));
    }

    #[Route('/{id}/regenerate-qr', name: 'api_employees_regenerate_qr', methods: ['POST'])]
    public function regenerateQrCode(
        \Symfony\Component\HttpFoundation\Request $request,
        int $id,
        EmployeeRepository $employeeRepository,
        QrCodeRotationService $qrCodeRotationService,
        AuthContext $authContext,
    ): JsonResponse {
        try {
            $authContext->requireAdmin($request);
        } catch (\RuntimeException $exception) {
            if ('forbidden' !== $exception->getMessage()) {
                throw $exception;
            }

            return $this->json([
                'code' => 'forbidden',
                'message' => 'Alleen admins mogen badges vernieuwen.',
            ], 403);
        }

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
                'profile' => [
                    'department' => $employee->getDepartment(),
                    'employmentType' => $employee->getEmploymentType(),
                    'location' => $employee->getLocation(),
                ],
            ],
        ]);
    }
}
