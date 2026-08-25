<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Crea usuarios, intentos de acceso y auditoría del servidor.
 * El rollback elimina estas tablas en orden inverso y, por ello, destruye sus datos.
 */
final class CreateAuthFoundation extends AbstractMigration
{
    public function up(): void
    {
        $users = $this->table('users', ['id' => false, 'primary_key' => ['id']]);
        $users
            ->addColumn('id', 'uuid')
            ->addColumn('code', 'string', ['limit' => 24])
            ->addColumn('name', 'string', ['limit' => 100])
            ->addColumn('email', 'string', ['limit' => 254])
            ->addColumn('phone', 'string', ['limit' => 20])
            ->addColumn('avatar', 'text', ['null' => false, 'default' => ''])
            ->addColumn('pin_hash', 'string', ['limit' => 255])
            ->addColumn('role', 'string', ['limit' => 16])
            ->addColumn('status', 'string', ['limit' => 24])
            ->addColumn('preferred_rest_day', 'integer', ['null' => true, 'signed' => false])
            ->addColumn('color', 'string', ['limit' => 7, 'default' => '#6366f1'])
            ->addColumn('hire_date', 'date')
            ->addColumn('notes', 'text', ['null' => true])
            ->addColumn('failed_login_count', 'integer', ['default' => 0, 'signed' => false])
            ->addColumn('locked_until', 'datetime', ['null' => true])
            ->addColumn('version', 'integer', ['default' => 1, 'signed' => false])
            ->addColumn('created_at', 'datetime')
            ->addColumn('updated_at', 'datetime')
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->addIndex(['code'], ['unique' => true, 'name' => 'uq_users_code'])
            ->addIndex(['email'], ['unique' => true, 'name' => 'uq_users_email'])
            ->addIndex(['role', 'status'], ['name' => 'idx_users_role_status'])
            ->addIndex(['locked_until'], ['name' => 'idx_users_locked_until'])
            ->addIndex(['deleted_at'], ['name' => 'idx_users_deleted_at'])
            ->create();

        $sessions = $this->table('auth_sessions', ['id' => false, 'primary_key' => ['id_hash']]);
        $sessions
            ->addColumn('id_hash', 'string', ['limit' => 64])
            ->addColumn('user_id', 'uuid', ['null' => true])
            ->addColumn('csrf_token_hash', 'string', ['limit' => 64])
            ->addColumn('user_agent_hash', 'string', ['limit' => 64])
            ->addColumn('ip_hash', 'string', ['limit' => 64])
            ->addColumn('created_at', 'datetime')
            ->addColumn('last_seen_at', 'datetime')
            ->addColumn('expires_at', 'datetime')
            ->addColumn('revoked_at', 'datetime', ['null' => true])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_auth_sessions_user',
            ])
            ->addIndex(['user_id'], ['name' => 'idx_auth_sessions_user'])
            ->addIndex(['expires_at', 'revoked_at'], ['name' => 'idx_auth_sessions_expiry'])
            ->create();

        $attempts = $this->table('login_attempts', ['id' => false, 'primary_key' => ['id']]);
        $attempts
            ->addColumn('id', 'uuid')
            ->addColumn('user_id', 'uuid', ['null' => true])
            ->addColumn('identifier_hash', 'string', ['limit' => 64])
            ->addColumn('ip_hash', 'string', ['limit' => 64])
            ->addColumn('successful', 'boolean', ['default' => false])
            ->addColumn('attempted_at', 'datetime')
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_login_attempts_user',
            ])
            ->addIndex(['user_id'], ['name' => 'idx_login_attempts_user'])
            ->addIndex(['identifier_hash', 'attempted_at'], ['name' => 'idx_login_attempts_identifier_time'])
            ->addIndex(['ip_hash', 'attempted_at'], ['name' => 'idx_login_attempts_ip_time'])
            ->create();

        $auditLogs = $this->table('audit_logs', ['id' => false, 'primary_key' => ['id']]);
        $auditLogs
            ->addColumn('id', 'uuid')
            ->addColumn('actor_user_id', 'uuid', ['null' => true])
            ->addColumn('action', 'string', ['limit' => 120])
            ->addColumn('entity_type', 'string', ['limit' => 80])
            ->addColumn('entity_id', 'uuid', ['null' => true])
            ->addColumn('payload_json', 'text', ['null' => true])
            ->addColumn('ip_hash', 'string', ['limit' => 64])
            ->addColumn('created_at', 'datetime')
            ->addForeignKey('actor_user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_audit_logs_actor',
            ])
            ->addIndex(['actor_user_id', 'created_at'], ['name' => 'idx_audit_actor_time'])
            ->addIndex(['entity_type', 'entity_id'], ['name' => 'idx_audit_entity'])
            ->addIndex(['created_at'], ['name' => 'idx_audit_created_at'])
            ->create();
    }

    public function down(): void
    {
        $this->table('audit_logs')->drop()->save();
        $this->table('login_attempts')->drop()->save();
        $this->table('auth_sessions')->drop()->save();
        $this->table('users')->drop()->save();
    }
}
