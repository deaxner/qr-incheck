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
            ['Alice Janssen', 'ALICE-DEMO-001'],
            ['Bob de Vries', 'BOB-DEMO-002'],
            ['Charlie Bakker', 'CHARLIE-DEMO-003'],
        ];

        foreach ($employees as [$name, $qrCode]) {
            $manager->persist(new Employee($name, $qrCode));
        }

        $manager->flush();
    }
}
