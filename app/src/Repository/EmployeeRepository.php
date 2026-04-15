<?php

namespace App\Repository;

use App\Entity\Employee;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Employee>
 */
class EmployeeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Employee::class);
    }

    public function findByActiveQrCode(string $qrCode): ?Employee
    {
        return $this->findOneBy(['qrCode' => $qrCode]);
    }

    /**
     * @return Employee[]
     */
    public function findAllOrderedByName(): array
    {
        return $this->createQueryBuilder('employee')
            ->orderBy('employee.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
