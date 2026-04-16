<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260416122500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add employee profile columns for truthful frontend views';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE employee ADD department VARCHAR(255) NOT NULL DEFAULT 'Operations', ADD employment_type VARCHAR(64) NOT NULL DEFAULT 'Full-time', ADD location VARCHAR(255) NOT NULL DEFAULT 'HQ'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE employee DROP department, DROP employment_type, DROP location');
    }
}
