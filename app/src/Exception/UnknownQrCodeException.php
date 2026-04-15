<?php

namespace App\Exception;

class UnknownQrCodeException extends \RuntimeException
{
    public function __construct()
    {
        parent::__construct('Onbekende of ingetrokken QR-code.');
    }
}
