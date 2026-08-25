<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Tests\Auth;

use PDO;
use PHPUnit\Framework\TestCase;

final class AuthServiceTest extends TestCase
{
    public function testValidCredentialsReturnSafeSessionUser(): void
    {
        $serviceClass = 'GarzonTurnos\\Api\\Auth\\AuthService';
        if (!class_exists($serviceClass)) {
            self::fail('AuthService must implement secure credential verification.');
        }

        $database = $this->createDatabase();
        $this->insertUser($database);

        $service = new $serviceClass($database);
        $user = $service->authenticate(' gz-21 ', '4826');

        self::assertSame([
            'id' => '8196c947-ef71-48b5-99e1-53139310ec88',
            'code' => 'GZ-21',
            'name' => 'Daniela Soto',
            'email' => 'daniela@example.com',
            'phone' => '+56 9 8123 4567',
            'avatar' => '',
            'role' => 'worker',
            'status' => 'active',
        ], $user);
        self::assertArrayNotHasKey('pin_hash', $user);
    }

    public function testFiveInvalidPinsTemporarilyLockTheAccount(): void
    {
        $serviceClass = 'GarzonTurnos\\Api\\Auth\\AuthService';
        if (!class_exists($serviceClass)) {
            self::fail('AuthService must implement secure credential verification.');
        }

        $database = $this->createDatabase();
        $this->insertUser($database);
        $service = new $serviceClass($database);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            self::assertNull($service->authenticate('GZ-21', '0000'));
        }

        $state = $database->query(
            "SELECT failed_login_count, locked_until FROM users WHERE code = 'GZ-21'"
        )->fetch();

        self::assertSame(5, (int) $state['failed_login_count']);
        self::assertNotNull($state['locked_until']);
        self::assertNull($service->authenticate('GZ-21', '4826'));
    }

    private function createDatabase(): PDO
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

        return $database;
    }

    private function insertUser(PDO $database): void
    {
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
    }
}
