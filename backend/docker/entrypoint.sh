#!/bin/sh
set -e

max_attempts="${APP_BOOT_RETRY_ATTEMPTS:-30}"
sleep_seconds="${APP_BOOT_RETRY_SLEEP_SECONDS:-2}"
attempt=1

until php bin/console doctrine:migrations:migrate --no-interaction; do
    if [ "$attempt" -ge "$max_attempts" ]; then
        echo "Backend startup aborted after ${attempt} migration attempts." >&2
        exit 1
    fi

    echo "Database not ready for migrations yet (attempt ${attempt}/${max_attempts}); retrying in ${sleep_seconds}s..." >&2
    attempt=$((attempt + 1))
    sleep "$sleep_seconds"
done

php bin/console app:seed-demo-if-empty --no-interaction

exec apache2-foreground
