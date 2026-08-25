<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Auth;

use DateTimeImmutable;
use DateTimeZone;
use PDO;
use UnexpectedValueException;

final class AuthService
{
    private const MAX_FAILED_ATTEMPTS = 5;
    private const LOCK_MINUTES = 15;
    private static ?string $dummyHash = null;

    public function __construct(private readonly PDO $database)
    {
    }

    /**
     * @return array{id: string, code: string, name: string, email: string, phone: string, avatar: string, role: string, status: string}|null
     */
    public function authenticate(string $identifier, string $pin): ?array
    {
        $normalizedIdentifier = mb_strtolower(trim($identifier), 'UTF-8');
        $query = $this->database->prepare(
            'SELECT id, code, name, email, phone, avatar, pin_hash, role, status, failed_login_count, locked_until '
            . 'FROM users WHERE (LOWER(code) = :identifier OR LOWER(email) = :identifier) LIMIT 1'
        );
        $query->execute(['identifier' => $normalizedIdentifier]);
        $user = $query->fetch();

        if (!is_array($user)) {
            self::$dummyHash ??= password_hash(bin2hex(random_bytes(32)), PASSWORD_ARGON2ID);
            password_verify(trim($pin), self::$dummyHash);
            return null;
        }

        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        $lockedUntil = $user['locked_until'] ?? null;
        $isLocked = is_string($lockedUntil)
            && $lockedUntil !== ''
            && new DateTimeImmutable($lockedUntil, new DateTimeZone('UTC')) > $now;
        $pinMatches = password_verify(trim($pin), self::requiredString($user, 'pin_hash'));

        if ($isLocked || self::requiredString($user, 'status') !== 'active') {
            return null;
        }

        if (!$pinMatches) {
            $failedAttempts = (int) $user['failed_login_count'] + 1;
            $lockedUntil = $failedAttempts >= self::MAX_FAILED_ATTEMPTS
                ? $now->modify('+' . self::LOCK_MINUTES . ' minutes')->format('Y-m-d H:i:s')
                : null;
            $update = $this->database->prepare(
                'UPDATE users SET failed_login_count = :failed_login_count, locked_until = :locked_until WHERE id = :id'
            );
            $update->execute([
                'failed_login_count' => $failedAttempts,
                'locked_until' => $lockedUntil,
                'id' => self::requiredString($user, 'id'),
            ]);

            return null;
        }

        $reset = $this->database->prepare(
            'UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = :id'
        );
        $reset->execute(['id' => self::requiredString($user, 'id')]);

        return self::toSessionUser($user);
    }

    /**
     * @return array{id: string, code: string, name: string, email: string, phone: string, avatar: string, role: string, status: string}|null
     */
    public function findSessionUserById(string $userId): ?array
    {
        $query = $this->database->prepare(
            'SELECT id, code, name, email, phone, avatar, role, status '
            . 'FROM users WHERE id = :id AND status = :status LIMIT 1'
        );
        $query->execute(['id' => $userId, 'status' => 'active']);
        $user = $query->fetch();

        return is_array($user) ? self::toSessionUser($user) : null;
    }

    /**
     * PDO deliberately exposes fetched rows as mixed values. Normalize at the
     * database boundary so malformed persisted data fails closed and never
     * leaks into the API contract.
     *
     * @param array<mixed, mixed> $row
     * @return array{id: string, code: string, name: string, email: string, phone: string, avatar: string, role: string, status: string}
     */
    private static function toSessionUser(array $row): array
    {
        return [
            'id' => self::requiredString($row, 'id'),
            'code' => self::requiredString($row, 'code'),
            'name' => self::requiredString($row, 'name'),
            'email' => self::requiredString($row, 'email'),
            'phone' => self::requiredString($row, 'phone'),
            'avatar' => self::requiredString($row, 'avatar'),
            'role' => self::requiredString($row, 'role'),
            'status' => self::requiredString($row, 'status'),
        ];
    }

    /** @param array<mixed, mixed> $row */
    private static function requiredString(array $row, string $field): string
    {
        $value = $row[$field] ?? null;
        if (!is_string($value)) {
            throw new UnexpectedValueException(sprintf('Invalid database value for users.%s.', $field));
        }

        return $value;
    }
}
