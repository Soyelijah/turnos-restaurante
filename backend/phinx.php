<?php

declare(strict_types=1);

$environment = getenv('APP_ENV') ?: 'development';
$adapter = getenv('DB_ADAPTER') ?: ($environment === 'test' ? 'sqlite' : 'mysql');

$database = $adapter === 'sqlite'
    ? [
        'adapter' => 'sqlite',
        'name' => getenv('DB_NAME') ?: __DIR__ . '/var/test.sqlite',
    ]
    : [
        'adapter' => 'mysql',
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('DB_PORT') ?: 3306),
        'name' => getenv('DB_NAME') ?: 'garzon_turnos',
        'user' => getenv('DB_USER') ?: '',
        'pass' => getenv('DB_PASSWORD') ?: '',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ];

return [
    'paths' => [
        'migrations' => __DIR__ . '/database/migrations',
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => $environment,
        $environment => $database,
    ],
    'version_order' => 'creation',
];
