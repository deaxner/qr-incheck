<?php

namespace App\Service;

class QrCodeGenerator
{
    public function generate(): string
    {
        return sprintf(
            '%s-%s',
            strtoupper(bin2hex(random_bytes(4))),
            strtoupper(bin2hex(random_bytes(4)))
        );
    }
}
