#!/bin/sh
set -e

php bin/console doctrine:migrations:migrate --no-interaction
php bin/console app:seed-demo-if-empty --no-interaction

exec apache2-foreground
