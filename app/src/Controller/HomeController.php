<?php

namespace App\Controller;

use App\Service\EmployeeOverviewService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'home', methods: ['GET'])]
    public function __invoke(EmployeeOverviewService $employeeOverviewService): Response
    {
        return $this->render('home/index.html.twig', [
            'employees' => $employeeOverviewService->getOverview(),
        ]);
    }
}
