<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Config;

use PDO;
use RuntimeException;

final class DatabaseFactory
{
    /** @param array<string, string> $environment */
    public static function create(array $environment): PDO
    {
        $dsn = trim($environment['DB_DSN'] ?? '');
        if ($dsn === '') {
            throw new RuntimeException('DB_DSN is required.');
        }

        return new PDO(
            $dsn,
            $environment['DB_USER'] ?? '',
            $environment['DB_PASSWORD'] ?? '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            ],
        );
    }
}
