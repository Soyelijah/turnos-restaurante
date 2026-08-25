# ADR-001: API PHP y base de datos MySQL para operación multiusuario

**Estado:** Aceptado
**Fecha:** 2026-08-25
**Decisor:** Propietario de GarzónTurnos Pro

## Contexto

GarzónTurnos Pro es hoy una SPA React/Vite que guarda todos los datos y la sesión en `localStorage`. Ese modelo permite demostraciones locales, pero no ofrece autenticación, autorización, transacciones ni sincronización entre dispositivos.

Restricciones verificadas:

- `zgamersa.com` responde mediante LiteSpeed, una plataforma normalmente compatible con PHP en hosting compartido.
- El soporte Node.js del plan de hosting no está confirmado.
- El entorno local tiene PHP 8.4, Composer y Docker.
- La escala inicial asumida es un restaurante, menos de 100 usuarios y carga operativa moderada.
- Frontend y API deben publicarse bajo el mismo origen para simplificar cookies, CORS y CSRF.

## Decisión

Mantener React/Vite como frontend y crear una API REST versionada en PHP 8.2+ con MySQL 8/MariaDB 10.6+.

La autenticación utilizará sesiones del lado servidor y una cookie opaca con `HttpOnly`, `SameSite=Strict` y `Secure` únicamente bajo HTTPS. Toda mutación exigirá token CSRF. Los PIN se almacenarán exclusivamente como hash Argon2id; ni el PIN ni su hash serán enviados al frontend.

La autorización se comprobará en cada endpoint mediante una política deny-by-default. Los controles de rol del frontend seguirán existiendo solo como UX.

```text
Navegador React
     |
     | HTTPS /api/v1 + cookie HttpOnly + CSRF
     v
API PHP (LiteSpeed)
     |-- Auth / RBAC / validación / rate limit
     |-- Servicios de dominio y transacciones
     |-- Auditoría generada por servidor
     v
MySQL / MariaDB
     |-- users, zones, shifts, tasks, swap_requests
     |-- audit_logs, login_attempts
```

## Límites de responsabilidad

- React nunca decide si una operación está autorizada.
- La API nunca confía en `role`, `actorId`, fechas de auditoría ni IDs de usuario enviados por React.
- MySQL aplica claves foráneas, unicidad e integridad relacional.
- `localStorage` podrá conservar preferencias visuales no sensibles, pero dejará de ser fuente de autoridad.
- El service worker no almacenará `/api/` ni respuestas autenticadas.

## Opciones consideradas

### A. PHP 8.2+ y MySQL en el mismo hosting — elegida

| Dimensión | Evaluación |
|---|---|
| Compatibilidad con LiteSpeed/cPanel | Alta |
| Complejidad operativa | Baja |
| Coste adicional | Bajo |
| Escalabilidad inicial | Suficiente |
| Seguridad | Alta si se aplican sesiones, CSRF, RBAC y prepared statements |

Ventajas: mismo origen, despliegue simple y uso del MySQL habitual del hosting.
Desventajas: si el sistema crece a múltiples instancias habrá que externalizar sesiones y procesos programados.

### B. Node.js/Express y MySQL

| Dimensión | Evaluación |
|---|---|
| Compatibilidad confirmada con hosting | No confirmada |
| Reutilización de TypeScript | Alta |
| Complejidad operativa | Media |
| Escalabilidad | Alta |

No se elige porque el soporte Node del hosting no está demostrado. Puede reconsiderarse si se contrata VPS, contenedor o plan con Passenger/Node.

### C. SPA estática y `localStorage`

| Dimensión | Evaluación |
|---|---|
| Coste | Mínimo |
| Sincronización | Inexistente |
| Autorización real | Inexistente |
| Integridad y auditoría | Inadecuadas |

Rechazada para producción.

## Modelo de despliegue

- Desarrollo: Vite para frontend y servidor PHP local; MariaDB reproducible con Docker.
- Producción: `dist/` como SPA y `/api/v1` servido por PHP bajo el mismo dominio.
- Secretos: archivo de entorno fuera del document root y nunca en Git.
- Migraciones: versionadas, transaccionales cuando el motor lo permita, con rollback y verificación previa al despliegue.
- Backups: base de datos central cifrada por el proveedor; las exportaciones de negocio no incluyen credenciales.

## Consecuencias

- La interfaz seguirá funcionando mientras se migra módulo por módulo, pero no se declarará lista para producción hasta retirar credenciales y autoridad de `localStorage`.
- Será necesario crear cuentas reales y establecer el primer administrador mediante comando CLI seguro, no mediante datos semilla publicados.
- Todos los endpoints requerirán pruebas de autorización y validación.
- Antes del despliegue se debe confirmar PHP 8.2+, PDO MySQL, variables de entorno, HTTPS y capacidad de ejecutar migraciones en el hosting.

## Acciones

1. Implementar cimiento HTTP, configuración y manejo uniforme de errores.
2. Crear migración inicial de usuarios, intentos de acceso y auditoría.
3. Implementar CSRF, login, logout y consulta de sesión.
4. Migrar personal, zonas, turnos, tareas y permutas a endpoints protegidos.
5. Integrar React y retirar PIN, sesión, roles y datos operativos de `localStorage`.
6. Excluir `/api/` del service worker y añadir pruebas E2E.
