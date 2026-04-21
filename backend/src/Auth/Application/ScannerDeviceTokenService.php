<?php

namespace App\Auth\Application;

class ScannerDeviceTokenService
{
    public function __construct(
        private readonly string $configuredToken,
    ) {
    }

    public function isValid(?string $providedToken): bool
    {
        if (null === $providedToken) {
            return false;
        }

        $configuredToken = trim($this->configuredToken);
        $token = trim($providedToken);

        if ('' === $configuredToken || '' === $token) {
            return false;
        }

        return hash_equals($configuredToken, $token);
    }
}
