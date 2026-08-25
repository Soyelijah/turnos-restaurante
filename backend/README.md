# GarzónTurnos Pro API

API PHP 8.2+ para autenticación y futura sincronización multiusuario.

## Desarrollo local

```powershell
Copy-Item .env.example .env
composer install
composer db:migrate
php -S 127.0.0.1:8080 -t public public/router.php
```

Antes de iniciar, reemplaza los valores de ejemplo de `.env`, en especial `DB_PASSWORD` y `APP_AUDIT_PEPPER`. El pepper debe ser aleatorio, tener al menos 32 caracteres y permanecer fuera de Git.

## Verificación

```powershell
composer validate --strict
composer audit
composer test
```

La API no crea un administrador predeterminado y nunca debe incorporar PIN en texto plano a seeds o migraciones. El aprovisionamiento inicial se añadirá como comando CLI separado y requerirá intervención explícita del propietario.
