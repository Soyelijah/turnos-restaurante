<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Http;

final class SessionCookie
{
    public static function create(
        string $name,
        string $token,
        int $maxAge,
        bool $secure,
    ): string {
        $parts = [
            rawurlencode($name) . '=' . rawurlencode($token),
            'Path=/',
            'Max-Age=' . $maxAge,
            'HttpOnly',
            'SameSite=Strict',
        ];
        if ($secure) {
            $parts[] = 'Secure';
        }

        return implode('; ', $parts);
    }

    public static function clear(string $name, bool $secure): string
    {
        return self::create($name, '', 0, $secure) . '; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
}
