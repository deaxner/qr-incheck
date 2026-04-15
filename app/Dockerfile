FROM composer:2 AS composer_deps
WORKDIR /app
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-interaction --no-scripts

FROM node:22-alpine AS frontend_builder
WORKDIR /app
COPY package.json package-lock.json vite.config.js ./
COPY assets ./assets
RUN npm ci
RUN npm run build

FROM php:8.2-apache
WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev unzip \
    && docker-php-ext-install intl pdo_mysql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY . .
COPY --from=composer_deps /app/vendor ./vendor
COPY --from=frontend_builder /app/public/ui ./public/ui

RUN php bin/console cache:clear

RUN chown -R www-data:www-data /var/www/html/var

EXPOSE 80
