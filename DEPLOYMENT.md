# Despliegue en zgamersa.com

GarzónTurnos Pro se compone de dos piezas: la SPA React generada en `dist/` y la API PHP ubicada en `backend/`. En producción no se necesita un proceso Node.js residente, pero sí PHP 8.2 o superior, Composer y MySQL/MariaDB. El frontend y `/api/v1` deben publicarse bajo el mismo origen.

> La interfaz todavía usa almacenamiento local mientras se completa la migración funcional. Este documento prepara la infraestructura, pero no convierte por sí solo la versión actual en apta para trabajadores reales.

## Requisitos

- Node.js 22 o superior y npm, únicamente para compilar y verificar la SPA.
- PHP 8.2 o superior con `json`, `mbstring`, `pdo` y `pdo_mysql`.
- Composer 2.
- MySQL 8 o MariaDB 10.6 o superior con una base y un usuario exclusivos.
- HTTPS obligatorio en el dominio final.

## Desarrollo local

```powershell
npm ci
composer --working-dir=backend install
Copy-Item backend/.env.example backend/.env
```

Configura `backend/.env` con una base local, genera un `APP_AUDIT_PEPPER` aleatorio de al menos 32 caracteres y ejecuta:

```powershell
composer --working-dir=backend db:migrate
php -S 127.0.0.1:8080 -t backend/public backend/public/router.php
npm run dev
```

La SPA queda disponible en `http://127.0.0.1:3000` y la API de desarrollo en `http://127.0.0.1:8080/api/v1`. React todavía no consume esta API; esa integración forma parte de la siguiente fase.

## Verificación antes de publicar

```powershell
npm ci
composer --working-dir=backend install --no-interaction --prefer-dist
npm run check
npm audit --audit-level=low
composer --working-dir=backend audit
```

No se debe desplegar si falla alguna comprobación o si el contrato `docs/api/openapi.yaml` no valida.

## Artefactos de producción

1. Ejecuta `npm run build` y publica el contenido de `dist/` como SPA.
2. Publica `backend/` fuera del document root siempre que el hosting lo permita.
3. Expón únicamente `backend/public/` para las solicitudes `/api/*`.
4. Ejecuta `composer install --working-dir=backend --no-dev --classmap-authoritative` en el servidor o prepara `vendor/` dentro de un artefacto controlado.
5. Crea `backend/.env` directamente en el servidor. Nunca subas `.env`, respaldos, credenciales ni archivos de base de datos al repositorio o al document root.
6. Ejecuta `composer --working-dir=backend db:migrate` antes de habilitar tráfico.

## Apache o cPanel

- El document root sirve los archivos de `dist/` y conserva su `.htaccess`.
- La ruta pública `/api/` debe apuntar a `backend/public/`; su `.htaccess` envía las rutas a `index.php`.
- Si cPanel no permite alias o cambiar document roots, solicita al hosting una regla equivalente. No copies el resto de `backend/` dentro de `public_html`.
- Activa HTTPS y mantén `SESSION_SECURE=true`.
- Confirma que `mod_rewrite` y `mod_headers` estén disponibles.

## Nginx

`deploy/nginx.conf.example` sirve como base para la SPA. Antes de usarlo en producción se debe añadir un bloque `/api/` que envíe todas las solicitudes a `backend/public/index.php` mediante la versión de PHP-FPM instalada en el servidor. La ruta del socket PHP-FPM varía por hosting y no debe adivinarse.

## Dominio y subcarpetas

La configuración de ejemplo usa `turnos.zgamersa.com`, aunque también puede publicarse en la raíz de `zgamersa.com`. Para una subcarpeta:

```powershell
$env:VITE_BASE_PATH='/turnos/'
npm run build
```

También se deben ajustar `start_url`, el alcance y registro del service worker, el fallback de la SPA y el montaje de `/api/v1`. No se debe publicar en una subcarpeta hasta verificar esos cuatro puntos.

## Comprobación posterior al despliegue

- `/`, `/manifest.webmanifest` y los assets responden por HTTPS.
- Una recarga directa de una ruta de la SPA devuelve `index.html`.
- `/api/v1/health` devuelve `200`, JSON y `Cache-Control: no-store`.
- `/api/v1/auth/csrf` establece la cookie con `HttpOnly`, `Secure` y `SameSite=Strict`.
- Las respuestas `/api/*` no aparecen en Cache Storage.
- `.env`, `composer.json`, migraciones y archivos internos no son accesibles por HTTP.

## Límite de la versión actual

El backend de autenticación y la base SQL ya existen, pero React aún conserva datos operativos y credenciales heredadas en `localStorage`. Antes de abrir el sistema a trabajadores reales se debe integrar la API, provisionar el administrador inicial de forma segura y migrar trabajadores, turnos, zonas, tareas y permutas a la base central.
