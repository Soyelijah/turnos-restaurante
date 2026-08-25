<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Tests\Http;

use PDO;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Stream;

final class AppFactoryTest extends TestCase
{
    public function testHealthEndpointReturnsNoStoreJsonResponse(): void
    {
        $factoryClass = 'GarzonTurnos\\Api\\Http\\AppFactory';
        if (!class_exists($factoryClass)) {
            self::fail('AppFactory must expose the versioned HTTP API.');
        }

        $database = new PDO('sqlite::memory:');
        $app = $factoryClass::create($database, [
            'sessionTtl' => 3600,
            'secureCookie' => false,
            'auditPepper' => 'test-only-audit-pepper-with-32-bytes',
        ]);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/api/v1/health');

        $response = $app->handle($request);
        $payload = json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('application/json; charset=utf-8', $response->getHeaderLine('Content-Type'));
        self::assertSame('no-store', $response->getHeaderLine('Cache-Control'));
        self::assertSame('nosniff', $response->getHeaderLine('X-Content-Type-Options'));
        self::assertSame('DENY', $response->getHeaderLine('X-Frame-Options'));
        self::assertSame("default-src 'none'; frame-ancestors 'none'", $response->getHeaderLine('Content-Security-Policy'));
        self::assertTrue($payload['success']);
        self::assertSame('ok', $payload['data']['status']);
        self::assertNotEmpty($payload['data']['timestamp']);
    }

    public function testCsrfLoginSessionAndLogoutLifecycle(): void
    {
        $factoryClass = 'GarzonTurnos\\Api\\Http\\AppFactory';
        if (!class_exists($factoryClass)) {
            self::fail('AppFactory must expose the versioned HTTP API.');
        }

        $database = $this->createAuthDatabase();
        $app = $factoryClass::create($database, [
            'sessionTtl' => 3600,
            'secureCookie' => false,
            'cookieName' => 'GTSESSID',
            'auditPepper' => 'test-only-audit-pepper-with-32-bytes',
        ]);
        $requests = new ServerRequestFactory();

        $csrfResponse = $app->handle($requests->createServerRequest('GET', '/api/v1/auth/csrf'));
        $csrfPayload = $this->decode($csrfResponse);
        $anonymousCookie = $this->cookieValue($csrfResponse->getHeaderLine('Set-Cookie'));
        self::assertSame(200, $csrfResponse->getStatusCode());
        self::assertNotEmpty($csrfPayload['data']['csrfToken']);
        self::assertStringContainsString('HttpOnly', $csrfResponse->getHeaderLine('Set-Cookie'));
        self::assertStringContainsString('SameSite=Strict', $csrfResponse->getHeaderLine('Set-Cookie'));
        self::assertStringNotContainsString('Secure', $csrfResponse->getHeaderLine('Set-Cookie'));

        $missingCsrf = $this->jsonRequest($requests, 'POST', '/api/v1/auth/login', [
            'identifier' => 'GZ-21',
            'pin' => '4826',
        ])->withCookieParams(['GTSESSID' => $anonymousCookie]);
        $missingCsrfResponse = $app->handle($missingCsrf);
        self::assertSame(403, $missingCsrfResponse->getStatusCode());
        self::assertSame('CSRF_INVALID', $this->decode($missingCsrfResponse)['code']);

        $login = $this->jsonRequest($requests, 'POST', '/api/v1/auth/login', [
            'identifier' => 'GZ-21',
            'pin' => '4826',
        ])
            ->withCookieParams(['GTSESSID' => $anonymousCookie])
            ->withHeader('X-CSRF-Token', $csrfPayload['data']['csrfToken']);
        $loginResponse = $app->handle($login);
        $loginPayload = $this->decode($loginResponse);
        $authenticatedCookie = $this->cookieValue($loginResponse->getHeaderLine('Set-Cookie'));
        $authenticatedCsrf = $loginResponse->getHeaderLine('X-CSRF-Token');
        self::assertSame(200, $loginResponse->getStatusCode());
        self::assertSame('Daniela Soto', $loginPayload['data']['name']);
        self::assertArrayNotHasKey('pin_hash', $loginPayload['data']);
        self::assertNotSame($anonymousCookie, $authenticatedCookie);
        self::assertNotEmpty($authenticatedCsrf);

        $oldSession = $requests
            ->createServerRequest('GET', '/api/v1/auth/session')
            ->withCookieParams(['GTSESSID' => $anonymousCookie]);
        self::assertSame(401, $app->handle($oldSession)->getStatusCode());

        $session = $requests
            ->createServerRequest('GET', '/api/v1/auth/session')
            ->withCookieParams(['GTSESSID' => $authenticatedCookie]);
        $sessionResponse = $app->handle($session);
        self::assertSame(200, $sessionResponse->getStatusCode());
        self::assertSame('GZ-21', $this->decode($sessionResponse)['data']['code']);

        $logout = $requests
            ->createServerRequest('POST', '/api/v1/auth/logout')
            ->withCookieParams(['GTSESSID' => $authenticatedCookie])
            ->withHeader('X-CSRF-Token', $authenticatedCsrf);
        $logoutResponse = $app->handle($logout);
        self::assertSame(200, $logoutResponse->getStatusCode());
        self::assertFalse($this->decode($logoutResponse)['data']['authenticated']);
        self::assertStringContainsString('Max-Age=0', $logoutResponse->getHeaderLine('Set-Cookie'));
        self::assertSame(401, $app->handle($session)->getStatusCode());
    }

    private function createAuthDatabase(): PDO
    {
        $database = new PDO('sqlite::memory:');
        $database->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $database->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $database->exec(
            'CREATE TABLE users ('
            . 'id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, '
            . 'phone TEXT NOT NULL, avatar TEXT NOT NULL, pin_hash TEXT NOT NULL, role TEXT NOT NULL, '
            . 'status TEXT NOT NULL, failed_login_count INTEGER NOT NULL DEFAULT 0, locked_until TEXT NULL'
            . ')'
        );
        $database->exec(
            'CREATE TABLE auth_sessions ('
            . 'id_hash TEXT PRIMARY KEY, user_id TEXT NULL, csrf_token_hash TEXT NOT NULL, '
            . 'user_agent_hash TEXT NOT NULL, ip_hash TEXT NOT NULL, created_at TEXT NOT NULL, '
            . 'last_seen_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT NULL'
            . ')'
        );
        $insert = $database->prepare(
            'INSERT INTO users (id, code, name, email, phone, avatar, pin_hash, role, status, failed_login_count) '
            . 'VALUES (:id, :code, :name, :email, :phone, :avatar, :pin_hash, :role, :status, 0)'
        );
        $insert->execute([
            'id' => '8196c947-ef71-48b5-99e1-53139310ec88',
            'code' => 'GZ-21',
            'name' => 'Daniela Soto',
            'email' => 'daniela@example.com',
            'phone' => '+56 9 8123 4567',
            'avatar' => '',
            'pin_hash' => password_hash('4826', PASSWORD_ARGON2ID),
            'role' => 'worker',
            'status' => 'active',
        ]);

        return $database;
    }

    /** @return array<string, mixed> */
    private function decode(\Psr\Http\Message\ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR);
    }

    /** @param array<string, mixed> $payload */
    private function jsonRequest(
        ServerRequestFactory $factory,
        string $method,
        string $path,
        array $payload,
    ): \Psr\Http\Message\ServerRequestInterface {
        $body = fopen('php://temp', 'r+');
        fwrite($body, json_encode($payload, JSON_THROW_ON_ERROR));
        rewind($body);

        return $factory
            ->createServerRequest($method, $path)
            ->withHeader('Content-Type', 'application/json')
            ->withBody(new Stream($body));
    }

    private function cookieValue(string $setCookie): string
    {
        $cookiePair = explode(';', $setCookie, 2)[0];
        return explode('=', $cookiePair, 2)[1] ?? '';
    }
}
