<?php

namespace App\Entity;

use App\Repository\EmployeeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EmployeeRepository::class)]
#[ORM\Table(name: 'employee')]
#[ORM\UniqueConstraint(name: 'uniq_employee_qr_code', columns: ['qr_code'])]
class Employee
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(name: 'qr_code', length: 64)]
    private string $qrCode;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, TimeEntry>
     */
    #[ORM\OneToMany(mappedBy: 'employee', targetEntity: TimeEntry::class, orphanRemoval: true)]
    #[ORM\OrderBy(['checkInAt' => 'DESC'])]
    private Collection $timeEntries;

    public function __construct(string $name, string $qrCode, ?\DateTimeImmutable $now = null)
    {
        $this->name = $name;
        $this->qrCode = $qrCode;
        $this->timeEntries = new ArrayCollection();
        $this->createdAt = $now ?? new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getQrCode(): string
    {
        return $this->qrCode;
    }

    public function rotateQrCode(string $qrCode, ?\DateTimeImmutable $at = null): void
    {
        $this->qrCode = $qrCode;
        $this->updatedAt = $at ?? new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }
}
