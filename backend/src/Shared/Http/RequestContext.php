<?php

namespace App\Shared\Http;

use Symfony\Component\HttpFoundation\Request;

final class RequestContext
{
    public const REQUEST_ID_ATTRIBUTE = '_request_id';
    public const REQUEST_STARTED_AT_ATTRIBUTE = '_request_started_at';
    public const REQUEST_ID_HEADER = 'X-Request-Id';

    public static function ensureRequestId(Request $request): string
    {
        $requestId = $request->attributes->get(self::REQUEST_ID_ATTRIBUTE);

        if (is_string($requestId) && '' !== $requestId) {
            return $requestId;
        }

        $headerRequestId = $request->headers->get(self::REQUEST_ID_HEADER);

        if (is_string($headerRequestId) && '' !== trim($headerRequestId)) {
            $requestId = trim($headerRequestId);
        } else {
            $requestId = bin2hex(random_bytes(16));
        }

        $request->attributes->set(self::REQUEST_ID_ATTRIBUTE, $requestId);

        return $requestId;
    }

    public static function getRequestId(Request $request): string
    {
        return self::ensureRequestId($request);
    }

    public static function markStarted(Request $request): void
    {
        if (!$request->attributes->has(self::REQUEST_STARTED_AT_ATTRIBUTE)) {
            $request->attributes->set(self::REQUEST_STARTED_AT_ATTRIBUTE, microtime(true));
        }
    }

    public static function getDurationMs(Request $request): int
    {
        self::markStarted($request);

        $startedAt = $request->attributes->get(self::REQUEST_STARTED_AT_ATTRIBUTE);

        if (!is_float($startedAt) && !is_int($startedAt)) {
            return 0;
        }

        return (int) round((microtime(true) - (float) $startedAt) * 1000);
    }
}
