FROM composer:2 AS composer_deps
WORKDIR /app
COPY backend/composer.json backend/composer.lock backend/symfony.lock ./
RUN composer install --no-interaction --no-scripts

FROM php:8.2-apache
WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev unzip \
    && docker-php-ext-install intl pdo_mysql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY backend/docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY backend/docker/php-timezone.ini /usr/local/etc/php/conf.d/zz-timezone.ini
COPY backend/ .
COPY --from=composer_deps /app/vendor ./vendor

RUN php bin/console cache:clear

RUN chown -R www-data:www-data /var/www/html/var

EXPOSE 80
