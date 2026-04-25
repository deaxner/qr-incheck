<?php

namespace App\Shared\Observability;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class MetricsController extends AbstractController
{
    #[Route('/metrics', name: 'metrics', methods: ['GET'])]
    public function __invoke(MetricsCollector $metricsCollector): Response
    {
        return new Response(
            $metricsCollector->exportPrometheus(),
            200,
            ['Content-Type' => 'text/plain; version=0.0.4; charset=utf-8'],
        );
    }
}
