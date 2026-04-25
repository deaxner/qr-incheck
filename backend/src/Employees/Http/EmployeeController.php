<?php

namespace App\Employees\Http;

use App\Auth\Application\AuthContext;
use App\Employees\Application\EmployeeHistoryService;
use App\Employees\Application\EmployeeOverviewService;
use App\Employees\Application\EmployeeSelfStatusService;
use App\Employees\Dto\EmployeeIdentityView;
use App\Employees\Application\QrCodeRotationService;
use App\Repository\EmployeeRepository;
use App\Shared\Http\ApiAccess;
use App\Shared\Http\ApiProblemResponseFactory;
use App\Shared\Http\OperationalEventLogger;
use App\Shared\Http\RequestContext;
use App\Shared\Observability\MetricsCollector;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/employees')]
class EmployeeController extends AbstractController
{
    public function __construct(
        private readonly ApiProblemResponseFactory $apiProblemResponseFactory,
        private readonly OperationalEventLogger $operationalEventLogger,
        private readonly MetricsCollector $metricsCollector,
    ) {
    }

    #[Route('', name: 'api_employees_index', methods: ['GET'])]
    public function index(
        \Symfony\Component\HttpFoundation\Request $request,
        EmployeeOverviewService $employeeOverviewService,
        ApiAccess $apiAccess,
    ): JsonResponse
    {
        $accessResult = $apiAccess->requireAdmin($request, 'Alleen admins mogen teamoverzichten bekijken.');

        if ($accessResult instanceof JsonResponse) {
            return $accessResult;
        }

        return $this->json(array_map(
            static fn ($view): array => $view->toArray(),
            $employeeOverviewService->getOverview(),
        ));
    }

    #[Route('/me/status', name: 'api_employees_me_status', methods: ['GET'])]
    public function selfStatus(
        \Symfony\Component\HttpFoundation\Request $request,
        EmployeeRepository $employeeRepository,
        EmployeeSelfStatusService $employeeSelfStatusService,
        AuthContext $authContext,
    ): JsonResponse {
        $user = $authContext->requireUser($request);
        $employee = $employeeRepository->find($user->employeeId);

        if (!$employee) {
            return $this->apiProblemResponseFactory->create(
                $request,
                'employee_not_found',
                'Medewerker niet gevonden.',
                404,
            );
        }

        return $this->json($employeeSelfStatusService->getForEmployee($employee)->toArray());
    }

    #[Route('/me/history', name: 'api_employees_me_history', methods: ['GET'])]
    public function selfHistory(
        \Symfony\Component\HttpFoundation\Request $request,
        EmployeeRepository $employeeRepository,
        EmployeeHistoryService $employeeHistoryService,
        AuthContext $authContext,
    ): JsonResponse {
        $user = $authContext->requireUser($request);
        $employee = $employeeRepository->find($user->employeeId);

        if (!$employee) {
            return $this->apiProblemResponseFactory->create(
                $request,
                'employee_not_found',
                'Medewerker niet gevonden.',
                404,
            );
        }

        return $this->json($employeeHistoryService->getForEmployee($employee)->toArray());
    }

    #[Route('/{id}/history', name: 'api_employees_history', methods: ['GET'])]
    public function history(
        \Symfony\Component\HttpFoundation\Request $request,
        int $id,
        EmployeeRepository $employeeRepository,
        EmployeeHistoryService $employeeHistoryService,
        ApiAccess $apiAccess,
    ): JsonResponse {
        $accessResult = $apiAccess->requireAdmin($request, 'Alleen admins mogen medewerkerhistorie bekijken.');

        if ($accessResult instanceof JsonResponse) {
            return $accessResult;
        }

        $employee = $employeeRepository->find($id);

        if (!$employee) {
            return $this->apiProblemResponseFactory->create(
                $request,
                'employee_not_found',
                'Medewerker niet gevonden.',
                404,
            );
        }

        return $this->json($employeeHistoryService->getForEmployee($employee)->toArray());
    }

    #[Route('/{id}/regenerate-qr', name: 'api_employees_regenerate_qr', methods: ['POST'])]
    public function regenerateQrCode(
        \Symfony\Component\HttpFoundation\Request $request,
        int $id,
        EmployeeRepository $employeeRepository,
        QrCodeRotationService $qrCodeRotationService,
        ApiAccess $apiAccess,
    ): JsonResponse {
        $accessResult = $apiAccess->requireAdmin($request, 'Alleen admins mogen badges vernieuwen.');

        if ($accessResult instanceof JsonResponse) {
            return $accessResult;
        }

        $employee = $employeeRepository->find($id);

        if (!$employee) {
            return $this->apiProblemResponseFactory->create(
                $request,
                'employee_not_found',
                'Medewerker niet gevonden.',
                404,
            );
        }

        $employee = $qrCodeRotationService->rotate($employee);

        $this->operationalEventLogger->logAudit('employee.badge.rotated', [
            'requestId' => RequestContext::getRequestId($request),
            'employeeId' => $employee->getId(),
            'employeeName' => $employee->getName(),
            'newQrCode' => $employee->getQrCode(),
        ]);
        $this->metricsCollector->incrementCounter('qr_badge_rotations_total', ['outcome' => 'success']);

        return $this->json([
            'employee' => EmployeeIdentityView::fromEmployee($employee)->toArray(),
        ]);
    }
}
