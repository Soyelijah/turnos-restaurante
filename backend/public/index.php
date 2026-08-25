<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use GarzonTurnos\Api\Config\DatabaseFactory;
use GarzonTurnos\Api\Config\Environment;
use GarzonTurnos\Api\Http\AppFactory;

require dirname(__DIR__) . '/vendor/autoload.php';

Dotenv::createImmutable(dirname(__DIR__))->safeLoad();

$database = DatabaseFactory::create([
    'DB_DSN' => Environment::get('DB_DSN'),
    'DB_USER' => Environment::get('DB_USER'),
    'DB_PASSWORD' => Environment::get('DB_PASSWORD'),
]);

$secureCookieValue = strtolower(Environment::get('SESSION_SECURE', 'true'));
$secureCookie = !in_array($secureCookieValue, ['0', 'false', 'no'], true);

$app = AppFactory::create($database, [
    'sessionTtl' => 28_800,
    'secureCookie' => $secureCookie,
    'cookieName' => Environment::get('SESSION_COOKIE', 'GTSESSID'),
    'auditPepper' => Environment::get('APP_AUDIT_PEPPER'),
]);
$app->run();
