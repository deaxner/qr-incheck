<?php

namespace App\Realtime\Application;

use App\Employees\Application\EmployeeHistoryService;
use App\Employees\Application\EmployeeOverviewService;
use App\Employees\Application\EmployeeSelfStatusService;
use App\Entity\Employee;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class EmployeeRealtimePublisher
{
    public function __construct(
        private readonly HubInterface $hub,
        private readonly EmployeeOverviewService $employeeOverviewService,
        private readonly EmployeeSelfStatusService $employeeSelfStatusService,
        private readonly EmployeeHistoryService $employeeHistoryService,
        #[Autowire('%env(bool:APP_REALTIME_ENABLED)%')] private readonly bool $enabled,
    ) {
    }

    /**
     * @param array{id:string,type:string,label:string,timestamp:string,location:string,employeeName:string,qrCode?:string}|null $activity
     */
    public function publishEmployeeUpdate(Employee $employee, ?array $activity = null): void
    {
        if (!$this->enabled) {
            return;
        }

        $payload = [
            'employee' => $this->employeeOverviewService->getOverviewForEmployee($employee),
            'selfStatus' => $this->employeeSelfStatusService->getForEmployee($employee),
            'history' => $this->employeeHistoryService->getForEmployee($employee),
            'activity' => $activity,
        ];

        try {
            $jsonPayload = json_encode($payload, JSON_THROW_ON_ERROR);

            $this->hub->publish(new Update(
                sprintf('/employees/%d', $employee->getId()),
                $jsonPayload
            ));
            $this->hub->publish(new Update(
                '/admin/activity',
                $jsonPayload
            ));
        } catch (\Throwable) {
            // Realtime delivery should not break the primary clocking or badge workflow.
        }
    }
}
