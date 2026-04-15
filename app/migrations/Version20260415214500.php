<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260415214500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create employee and time_entry tables for the QR incheck demo';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE employee (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, qr_code VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', UNIQUE INDEX uniq_employee_qr_code (qr_code), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("CREATE TABLE time_entry (id INT AUTO_INCREMENT NOT NULL, employee_id INT NOT NULL, check_in_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', check_out_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX idx_time_entry_employee_open (employee_id, check_out_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("ALTER TABLE time_entry ADD CONSTRAINT FK_TIME_ENTRY_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employee (id) ON DELETE CASCADE");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE time_entry DROP FOREIGN KEY FK_TIME_ENTRY_EMPLOYEE");
        $this->addSql("DROP TABLE time_entry");
        $this->addSql("DROP TABLE employee");
    }
}
