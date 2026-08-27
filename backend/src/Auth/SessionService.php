<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Auth;

use DateTimeImmutable;
use DateTimeZone;
use PDO;

final class SessionService
{
    public function __construct(
        private readonly PDO $database,
        private readonly int $ttlSeconds = 28_800,
        private readonly string $auditPepper = '',
    ) {
        if (strlen($this->auditPepper) < 32) {
            throw new \InvalidArgumentException('Audit pepper must contain at least 32 characters.');
        }
    }

    /** @return array{sessionToken: string, csrfToken: string, expiresAt: string} */
    public function createAnonymous(string $userAgent, string $ipAddress): array
    {
        return $this->createSession(null, $userAgent, $ipAddress);
    }

    /** @return array{sessionToken: string, csrfToken: string, expiresAt: string} */
    public function authenticateSession(
        string $anonymousToken,
        string $userId,
        string $userAgent,
        string $ipAddress,
    ): array {
        if ($this->findValid($anonymousToken) === null) {
            throw new \InvalidArgumentException('Cannot authenticate an invalid session.');
        }

        $this->database->beginTransaction();
        try {
            $revoke = $this->database->prepare(
                'UPDATE auth_sessions SET revoked_at = :revoked_at WHERE id_hash = :id_hash AND revoked_at IS NULL'
            );
            $revoke->execute([
                'revoked_at' => $this->now()->format('Y-m-d H:i:s'),
                'id_hash' => $this->hashToken($anonymousToken),
            ]);
            $session = $this->createSession($userId, $userAgent, $ipAddress);
            $this->database->commit();

            return $session;
        } catch (\Throwable $error) {
            $this->database->rollBack();
            throw $error;
        }
    }

    /** @return array<string, mixed>|null */
    public function findValid(string $sessionToken): ?array
    {
        if ($sessionToken === '') {
            return null;
        }

        $query = $this->database->prepare(
            'SELECT id_hash, user_id, csrf_token_hash, expires_at '
            . 'FROM auth_sessions '
            . 'WHERE id_hash = :id_hash AND revoked_at IS NULL AND expires_at > :now LIMIT 1'
        );
        $query->execute([
            'id_hash' => $this->hashToken($sessionToken),
            'now' => $this->now()->format('Y-m-d H:i:s'),
        ]);
        $session = $query->fetch();

        return is_array($session) ? $session : null;
    }

    public function validateCsrf(string $sessionToken, string $csrfToken): bool
    {
        if ($csrfToken === '') {
            return false;
        }

        $session = $this->findValid($sessionToken);

        return $session !== null
            && hash_equals($session['csrf_token_hash'], $this->hashToken($csrfToken));
    }

    public function rotateCsrf(string $sessionToken): ?string
    {
        if ($sessionToken === '') {
            return null;
        }

        $csrfToken = $this->generateToken();
        $rotate = $this->database->prepare(
            'UPDATE auth_sessions SET csrf_token_hash = :csrf_token_hash '
            . 'WHERE id_hash = :id_hash AND revoked_at IS NULL AND expires_at > :now'
        );
        $rotate->execute([
            'csrf_token_hash' => $this->hashToken($csrfToken),
            'id_hash' => $this->hashToken($sessionToken),
            'now' => $this->now()->format('Y-m-d H:i:s'),
        ]);

        return $rotate->rowCount() === 1 ? $csrfToken : null;
    }

    public function revoke(string $sessionToken): void
    {
        if ($sessionToken === '') {
            return;
        }

        $revoke = $this->database->prepare(
            'UPDATE auth_sessions SET revoked_at = :revoked_at WHERE id_hash = :id_hash AND revoked_at IS NULL'
        );
        $revoke->execute([
            'revoked_at' => $this->now()->format('Y-m-d H:i:s'),
            'id_hash' => $this->hashToken($sessionToken),
        ]);
    }

    /** @return array{sessionToken: string, csrfToken: string, expiresAt: string} */
    private function createSession(?string $userId, string $userAgent, string $ipAddress): array
    {
        $sessionToken = $this->generateToken();
        $csrfToken = $this->generateToken();
        $now = $this->now();
        $expiresAt = $now->modify('+' . $this->ttlSeconds . ' seconds');

        $insert = $this->database->prepare(
            'INSERT INTO auth_sessions '
            . '(id_hash, user_id, csrf_token_hash, user_agent_hash, ip_hash, created_at, last_seen_at, expires_at, revoked_at) '
            . 'VALUES (:id_hash, :user_id, :csrf_token_hash, :user_agent_hash, :ip_hash, :created_at, :last_seen_at, :expires_at, NULL)'
        );
        $insert->execute([
            'id_hash' => $this->hashToken($sessionToken),
            'user_id' => $userId,
            'csrf_token_hash' => $this->hashToken($csrfToken),
            'user_agent_hash' => $this->hashMetadata($userAgent),
            'ip_hash' => $this->hashMetadata($ipAddress),
            'created_at' => $now->format('Y-m-d H:i:s'),
            'last_seen_at' => $now->format('Y-m-d H:i:s'),
            'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
        ]);

        return [
            'sessionToken' => $sessionToken,
            'csrfToken' => $csrfToken,
            'expiresAt' => $expiresAt->format(DATE_ATOM),
        ];
    }

    private function generateToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function hashMetadata(string $value): string
    {
        return hash_hmac('sha256', $value, $this->auditPepper);
    }

    private function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('UTC'));
    }
}
