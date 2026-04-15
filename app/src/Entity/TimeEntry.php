<?php

namespace App\Entity;

use App\Repository\TimeEntryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TimeEntryRepository::class)]
#[ORM\Table(name: 'time_entry')]
#[ORM\Index(name: 'idx_time_entry_employee_open', columns: ['employee_id', 'check_out_at'])]
class TimeEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Employee::class, inversedBy: 'timeEntries')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Employee $employee;

    #[ORM\Column(name: 'check_in_at')]
    private \DateTimeImmutable $checkInAt;

    #[ORM\Column(name: 'check_out_at', nullable: true)]
    private ?\DateTimeImmutable $checkOutAt = null;

    public function __construct(Employee $employee, \DateTimeImmutable $checkInAt)
    {
        $this->employee = $employee;
        $this->checkInAt = $checkInAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmployee(): Employee
    {
        return $this->employee;
    }

    public function getCheckInAt(): \DateTimeImmutable
    {
        return $this->checkInAt;
    }

    public function getCheckOutAt(): ?\DateTimeImmutable
    {
        return $this->checkOutAt;
    }

    public function close(\DateTimeImmutable $checkOutAt): void
    {
        $this->checkOutAt = $checkOutAt;
    }
}
