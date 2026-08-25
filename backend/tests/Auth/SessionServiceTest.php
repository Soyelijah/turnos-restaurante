<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Tests\Auth;

use PDO;
use PHPUnit\Framework\TestCase;

final class SessionServiceTest extends TestCase
{
    public function testAnonymousSessionPersistsOnlyTokenHashes(): void
    {
        $serviceClass = 'GarzonTurnos\\Api\\Auth\\SessionService';
        if (!class_exists($serviceClass)) {
            self::fail('SessionService must keep raw session secrets outside the database.');
        }

        $database = $this->createDatabase();
        $auditPepper = 'test-only-audit-pepper-with-32-bytes';
        $service = new $serviceClass($database, 3600, $auditPepper);

        $session = $service->createAnonymous('browser-agent', '127.0.0.1');
        $stored = $database->query(
            'SELECT id_hash, csrf_token_hash, user_agent_hash, ip_hash, user_id FROM auth_sessions'
        )->fetch();

        self::assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $stored['id_hash']);
        self::assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $stored['csrf_token_hash']);
        self::assertNotSame($session['sessionToken'], $stored['id_hash']);
        self::assertNotSame($session['csrfToken'], $stored['csrf_token_hash']);
        self::assertSame(hash('sha256', $session['sessionToken']), $stored['id_hash']);
        self::assertSame(hash('sha256', $session['csrfToken']), $stored['csrf_token_hash']);
        self::assertSame(hash_hmac('sha256', '127.0.0.1', $auditPepper), $stored['ip_hash']);
        self::assertNull($stored['user_id']);
    }

    public function testAuthenticationRotatesSessionAndInvalidatesOldToken(): void
    {
        $serviceClass = 'GarzonTurnos\\Api\\Auth\\SessionService';
        if (!class_exists($serviceClass) || !method_exists($serviceClass, 'authenticateSession')) {
            self::fail('SessionService must rotate the session identifier after authentication.');
        }

        $database = $this->createDatabase();
        $service = new $serviceClass($database, 3600, 'test-only-audit-pepper-with-32-bytes');
        $anonymous = $service->createAnonymous('browser-agent', '127.0.0.1');

        $authenticated = $service->authenticateSession(
            $anonymous['sessionToken'],
            '8196c947-ef71-48b5-99e1-53139310ec88',
            'browser-agent',
            '127.0.0.1',
        );

        self::assertNotSame($anonymous['sessionToken'], $authenticated['sessionToken']);
        self::assertNull($service->findValid($anonymous['sessionToken']));
        self::assertSame(
            '8196c947-ef71-48b5-99e1-53139310ec88',
            $service->findValid($authenticated['sessionToken'])['user_id'],
        );
    }

    public function testCsrfValidationRequiresTheExactTokenBoundToTheSession(): void
    {
        $serviceClass = 'GarzonTurnos\\Api\\Auth\\SessionService';
        if (!class_exists($serviceClass) || !method_exists($serviceClass, 'validateCsrf')) {
            self::fail('SessionService must validate CSRF against the active server session.');
        }

        $database = $this->createDatabase();
        $service = new $serviceClass($database, 3600, 'test-only-audit-pepper-with-32-bytes');
        $session = $service->createAnonymous('browser-agent', '127.0.0.1');

        self::assertTrue($service->validateCsrf($session['sessionToken'], $session['csrfToken']));
        self::assertFalse($service->validateCsrf($session['sessionToken'], $session['csrfToken'] . 'x'));
        self::assertFalse($service->validateCsrf('unknown-session', $session['csrfToken']));
    }

    private function createDatabase(): PDO
    {
        $database = new PDO('sqlite::memory:');
        $database->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $database->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $database->exec(
            'CREATE TABLE auth_sessions ('
            . 'id_hash TEXT PRIMARY KEY, user_id TEXT NULL, csrf_token_hash TEXT NOT NULL, '
            . 'user_agent_hash TEXT NOT NULL, ip_hash TEXT NOT NULL, created_at TEXT NOT NULL, '
            . 'last_seen_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT NULL'
            . ')'
        );

        return $database;
    }
}
