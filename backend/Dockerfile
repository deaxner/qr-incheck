FROM composer:2 AS composer_bin

FROM php:8.5-cli AS composer_deps
WORKDIR /app
COPY --from=composer_bin /usr/bin/composer /usr/bin/composer
COPY backend/composer.json backend/composer.lock backend/symfony.lock ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/*
RUN composer install --no-interaction --no-scripts

FROM php:8.5-apache
WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libsqlite3-dev unzip \
    && docker-php-ext-install intl pdo_mysql pdo_sqlite \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY backend/docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY backend/docker/php-timezone.ini /usr/local/etc/php/conf.d/zz-timezone.ini
COPY backend/docker/entrypoint.sh /usr/local/bin/app-entrypoint
COPY backend/ .
COPY --from=composer_deps /app/vendor ./vendor

RUN php bin/console cache:clear

RUN chmod +x /usr/local/bin/app-entrypoint \
    && chown -R www-data:www-data /var/www/html/var

EXPOSE 80

ENTRYPOINT ["app-entrypoint"]
