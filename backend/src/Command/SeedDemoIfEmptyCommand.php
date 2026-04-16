<?php

namespace App\Command;

use App\Entity\Employee;
use App\Entity\TimeEntry;
use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed-demo-if-empty', description: 'Seed demo employees and time entries when the database is empty.')]
class SeedDemoIfEmptyCommand extends Command
{
    public function __construct(
        private readonly EmployeeRepository $employeeRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if ($this->employeeRepository->count([]) > 0) {
            $io->writeln('Demo data already present, skipping seed.');

            return Command::SUCCESS;
        }

        $timezone = new \DateTimeZone('Europe/Amsterdam');
        $now = new \DateTimeImmutable('now', $timezone);

        $alice = new Employee('Alice Janssen', 'ALICE-DEMO-001', 'Product Engineering', 'Full-time', 'Main Entrance');
        $bob = new Employee('Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby');
        $charlie = new Employee('Charlie Bakker', 'CHARLIE-DEMO-003', 'People & Planning', 'Full-time', 'HQ Reception');

        $this->entityManager->persist($alice);
        $this->entityManager->persist($bob);
        $this->entityManager->persist($charlie);
        $this->entityManager->flush();

        $alicePastEntry = new TimeEntry($alice, $now->modify('-1 day 08:55'));
        $alicePastEntry->close($now->modify('-1 day 17:12'));

        $bobOpenEntry = new TimeEntry($bob, $now->modify('-2 hours 15 minutes'));

        $charliePastEntry = new TimeEntry($charlie, $now->modify('-2 day 09:08'));
        $charliePastEntry->close($now->modify('-2 day 16:46'));

        $this->entityManager->persist($alicePastEntry);
        $this->entityManager->persist($bobOpenEntry);
        $this->entityManager->persist($charliePastEntry);
        $this->entityManager->flush();

        $io->success('Demo data seeded.');

        return Command::SUCCESS;
    }
}
