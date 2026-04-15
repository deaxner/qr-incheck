<?php

namespace App\Repository;

use App\Entity\Employee;
use App\Entity\TimeEntry;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TimeEntry>
 */
class TimeEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TimeEntry::class);
    }

    public function findOpenEntryForEmployee(Employee $employee): ?TimeEntry
    {
        return $this->createQueryBuilder('entry')
            ->andWhere('entry.employee = :employee')
            ->andWhere('entry.checkOutAt IS NULL')
            ->setParameter('employee', $employee)
            ->orderBy('entry.checkInAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @param list<int> $employeeIds
     *
     * @return array<int, TimeEntry>
     */
    public function findOpenEntriesIndexedByEmployeeIds(array $employeeIds): array
    {
        if ([] === $employeeIds) {
            return [];
        }

        $entries = $this->createQueryBuilder('entry')
            ->andWhere('entry.employee IN (:employeeIds)')
            ->andWhere('entry.checkOutAt IS NULL')
            ->setParameter('employeeIds', $employeeIds)
            ->getQuery()
            ->getResult();

        $indexed = [];

        foreach ($entries as $entry) {
            $indexed[$entry->getEmployee()->getId()] = $entry;
        }

        return $indexed;
    }

    /**
     * @param list<int> $employeeIds
     *
     * @return array<int, TimeEntry>
     */
    public function findLatestEntriesIndexedByEmployeeIds(array $employeeIds): array
    {
        if ([] === $employeeIds) {
            return [];
        }

        $entries = $this->createQueryBuilder('entry')
            ->andWhere('entry.employee IN (:employeeIds)')
            ->setParameter('employeeIds', $employeeIds)
            ->orderBy('entry.checkInAt', 'DESC')
            ->getQuery()
            ->getResult();

        $indexed = [];

        foreach ($entries as $entry) {
            $employeeId = $entry->getEmployee()->getId();

            if (!isset($indexed[$employeeId])) {
                $indexed[$employeeId] = $entry;
            }
        }

        return $indexed;
    }
}
