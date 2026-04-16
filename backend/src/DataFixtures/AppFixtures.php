<?php

namespace App\DataFixtures;

use App\Entity\Employee;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $employees = [
            ['Alice Janssen', 'ALICE-DEMO-001', 'Product Engineering', 'Full-time', 'Main Entrance'],
            ['Bob de Vries', 'BOB-DEMO-002', 'Operations', 'Shift-based', 'North Lobby'],
            ['Charlie Bakker', 'CHARLIE-DEMO-003', 'People & Planning', 'Full-time', 'HQ Reception'],
        ];

        foreach ($employees as [$name, $qrCode, $department, $employmentType, $location]) {
            $manager->persist(new Employee($name, $qrCode, $department, $employmentType, $location));
        }

        $manager->flush();
    }
}
