<?php

namespace App\Clocking\Http;

use App\Clocking\Application\ScanService;
use App\Clocking\Dto\ScanResponseView;
use App\Clocking\Exception\UnknownQrCodeException;
use App\Employees\Dto\EmployeeIdentityView;
use App\Shared\Http\ApiProblemResponseFactory;
use App\Shared\Http\OperationalEventLogger;
use App\Shared\Http\RequestContext;
use App\Shared\Observability\MetricsCollector;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use JsonException;

class ScanController extends AbstractController
{
    public function __construct(
        private readonly ApiProblemResponseFactory $apiProblemResponseFactory,
        private readonly OperationalEventLogger $operationalEventLogger,
        private readonly MetricsCollector $metricsCollector,
    ) {
    }

    #[Route('/api/scan', name: 'api_scan', methods: ['POST'])]
    public function __invoke(Request $request, ScanService $scanService): JsonResponse
    {
        try {
            $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => 'invalid_request']);
            return $this->apiProblemResponseFactory->create(
                $request,
                'invalid_request',
                'Voer een geldige QR-code in.',
                400,
            );
        }

        $code = is_array($payload) ? ($payload['code'] ?? '') : '';

        if (!is_string($code) || '' === trim($code)) {
            $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => 'invalid_request']);
            return $this->apiProblemResponseFactory->create(
                $request,
                'invalid_request',
                'Voer een geldige QR-code in.',
                400,
            );
        }

        try {
            $result = $scanService->process(trim($code));
        } catch (UnknownQrCodeException $exception) {
            $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => 'unknown_qr_code']);
            return $this->apiProblemResponseFactory->create(
                $request,
                'unknown_qr_code',
                $exception->getMessage(),
                404,
            );
        }

        $this->operationalEventLogger->logAudit('clocking.scan.accepted', [
            'requestId' => RequestContext::getRequestId($request),
            'employeeId' => $result->employee->getId(),
            'employeeName' => $result->employee->getName(),
            'action' => $result->action,
        ]);
        $this->metricsCollector->incrementCounter('qr_scan_requests_total', ['outcome' => $result->action]);

        return $this->json((new ScanResponseView(
            $result->action,
            $result->timestamp->format('Y-m-d H:i:s T'),
            EmployeeIdentityView::fromEmployee($result->employee),
        ))->toArray());
    }
}
