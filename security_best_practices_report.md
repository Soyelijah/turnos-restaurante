# Auditoría integral de arquitectura, sincronización y seguridad

Fecha: 2026-08-25
Proyecto: GarzónTurnos Pro
Alcance: repositorio local `turnos-restaurante`, build de producción y ejecución local en `http://127.0.0.1:4173/`

## Resumen ejecutivo

La aplicación está bien estructurada como prototipo React/Vite local y su build es reproducible con npm. Ya existe un cimiento backend PHP/MySQL con contrato OpenAPI, migraciones y autenticación de servidor. Sin embargo, **todavía no está preparada para operar de forma segura como sistema real multiusuario**, porque React aún utiliza el modelo local para autenticación, autorización, datos personales, turnos, auditoría y PIN.

El acceso administrativo predeterminado ya fue corregido. El riesgo crítico pendiente es que los PIN del modelo heredado siguen en texto plano dentro del código publicado, en `localStorage`, en la interfaz de administración y en los respaldos JSON. Las comprobaciones de rol del frontend son útiles para UX, pero no constituyen seguridad hasta que la interfaz consuma exclusivamente la API.

Dictamen: **apto para demostración/local; no apto todavía para producción con trabajadores reales**.

## Estado de remediación

- **SEC-001 corregido:** una instalación nueva ahora inicia sin autenticación y existe una prueba de regresión.
- **BUILD-001 corregido:** se eliminó el lockfile de Bun obsoleto; npm y Composer son las fuentes reproducibles.
- **SEC-002, SEC-003 y SEC-005 en progreso:** `backend/` incorpora contrato OpenAPI, MySQL/SQLite migrable, Argon2id, bloqueo temporal, sesiones opacas rotadas, CSRF y autorización de sesión. React todavía utiliza el modelo local, por lo que estos controles aún no protegen la interfaz completa.
- La conclusión de no aptitud para producción se mantiene hasta migrar los módulos de negocio y retirar credenciales/datos sensibles de `localStorage`.

## Arquitectura comprobada

- Frontend: React 19, TypeScript, Vite y Tailwind CSS.
- Backend/API: existe una base PHP 8.2+/Slim con endpoints versionados de salud, CSRF, login, sesión y logout; React todavía no la consume.
- Base de datos: existe una migración Phinx para MySQL/MariaDB con usuarios, sesiones, intentos de acceso y auditoría. La información funcional de la interfaz todavía persiste en `localStorage`.
- Sincronización: funciona únicamente entre el estado React y el `localStorage` de una pestaña/navegador. No existe sincronización entre dispositivos y tampoco se encontró escucha del evento `storage` o `BroadcastChannel` para coordinar pestañas.
- Despliegue: SPA estática con configuraciones de ejemplo para Apache y Nginx.

## Hallazgos críticos

### SEC-001 — Sesión administrativa activa de forma predeterminada

- Severidad: **Crítica**
- Ubicación: `src/context/AppContext.tsx:164-169`, `src/context/AppContext.tsx:207-218`, `src/data/initialData.ts:270-280`
- Evidencia original: `CURRENT_USER_ID` usa `worker-admin` como fallback y `SESSION` usaba `'true'` como fallback. El primer trabajador semilla tiene rol `admin`.
- Impacto: un visitante nuevo puede entrar directamente como administrador sin presentar credenciales y operar las funciones administrativas disponibles en ese navegador.
- Estado: **corregido**. El estado inicial ahora es no autenticado y una prueba SSR cubre una instalación sin almacenamiento previo. Esto reduce la exposición accidental, aunque **no sustituye** una autenticación real del lado servidor.
- Corrección definitiva: sesión emitida por backend mediante cookie `HttpOnly`, `Secure` en HTTPS y `SameSite`; identidad y rol resueltos en el servidor.

### SEC-002 — Autenticación y autorización exclusivamente en el cliente

- Severidad: **Crítica**
- Ubicación: `src/lib/session.ts:13-25`, `src/context/AppContext.tsx:216-220`, `src/context/AppContext.tsx:261-268`, `src/context/AppContext.tsx:276-330`
- Evidencia: el navegador busca usuario/PIN en el array local y `requireAdmin()` confía en `currentUser.role`, que también proviene del almacenamiento editable por el cliente.
- Impacto: cualquier persona con control del navegador puede alterar identidad, rol, turnos, trabajadores, zonas y respaldos. Ocultar botones o bloquear clic derecho no evita manipulación mediante DevTools, scripts o edición del almacenamiento.
- Corrección: crear API con autenticación y RBAC del lado servidor. Cada operación sensible debe comprobar la sesión y el permiso en el endpoint, independientemente de lo que muestre React.

## Hallazgos altos

### SEC-003 — PIN y datos personales almacenados y distribuidos en texto plano

- Severidad: **Alta**
- Ubicación: `src/data/initialData.ts:270-375`, `src/lib/session.ts:18-25`, `src/lib/storage.ts:15-33`, `src/views/WorkersManagementView.tsx:240-248`, `src/context/AppContext.tsx:737-755`
- Evidencia:
  - Los PIN semilla están escritos directamente en `initialData.ts`.
  - El login compara `worker.pin` directamente con el valor ingresado.
  - El array completo de trabajadores se persiste como JSON en `localStorage`.
  - La interfaz afirma “PIN criptográfico”, pero la implementación no aplica hash ni cifrado.
  - El respaldo exporta `workers` completo, incluyendo PIN, correo, teléfono y notas.
  - El build de producción contiene el usuario semilla y el PIN predeterminado.
- Impacto: exposición inmediata de credenciales y datos personales a cualquier script ejecutado en el origen, persona con acceso al equipo o receptor de un respaldo.
- Corrección: almacenar únicamente hashes Argon2id o bcrypt en el servidor; nunca enviar PIN ni hash al frontend; excluir credenciales de respuestas, listados y respaldos; cifrar respaldos que contengan datos personales.

### DATA-001 — No existe base de datos central ni sincronización multiusuario

- Severidad: **Alta para integridad operativa**
- Ubicación: `src/lib/storage.ts:3-53`, `src/context/AppContext.tsx:174-205`, `README.md:24-26`, `DEPLOYMENT.md:50-52`
- Evidencia: trabajadores, zonas, turnos, tareas, permutas, logs, usuario y sesión se guardan en claves independientes de `localStorage`. La propia documentación reconoce que no se sincronizan equipos.
- Impacto: cada celular puede ver datos distintos; dos encargados pueden sobrescribir trabajo; cambios parciales por cuota o cierre de pestaña pueden dejar entidades relacionadas inconsistentes. No hay transacciones, claves foráneas, control de concurrencia ni recuperación central.
- Corrección: base de datos central con migraciones, claves foráneas, índices, transacciones y copias de seguridad; API versionada; control de concurrencia mediante versión/ETag o timestamps de actualización.

### SEC-004 — La auditoría puede ser modificada o eliminada por el mismo cliente

- Severidad: **Alta**
- Ubicación: `src/context/AppContext.tsx:222-237`, `src/context/AppContext.tsx:737-790`, `src/lib/storage.ts:9-12`
- Evidencia: actor, fecha y eventos de auditoría se generan en el navegador y se guardan/importan junto con el resto del JSON.
- Impacto: un usuario puede falsificar, borrar o reemplazar la trazabilidad; el registro no sirve como evidencia confiable de quién modificó un turno o trabajador.
- Corrección: generar logs append-only en el backend a partir de la identidad autenticada, hora del servidor y metadatos de la solicitud; impedir que el cliente envíe o reescriba el autor.

## Hallazgos medios

### SEC-005 — Sin límite de intentos, bloqueo ni monitoreo de acceso

- Severidad: **Media**, elevada por el uso de PIN cortos
- Ubicación: `src/lib/session.ts:13-25`, `src/views/LoginModal.tsx:30-45`, `src/lib/domainSchemas.ts:15-24`
- Evidencia: cada intento ejecuta una comparación local inmediata; no hay rate limit, demora progresiva, bloqueo temporal ni registro confiable de fallos.
- Impacto: los PIN de cuatro dígitos son automatizables. Actualmente la exposición en el bundle hace innecesario incluso el ataque por fuerza bruta.
- Corrección: validar en backend, aplicar rate limiting por cuenta/IP/dispositivo, retraso progresivo y alertas; considerar credenciales más robustas o acceso con enlace/código temporal.

### SEC-006 — Cache indiscriminado del service worker (corregido)

- Severidad: **Corregida**
- Ubicación: `public/sw.js:18-29`
- Evidencia actual: el listener ignora `/api/`, solicitudes externas y métodos distintos de GET; tampoco almacena respuestas con `Cache-Control: no-store`. Los assets ausentes sin conexión ya no reciben el HTML de la aplicación como respuesta incorrecta.
- Verificación: `src/lib/serviceWorkerPolicy.test.ts` ejecuta el service worker real y cubre exclusión de API, `no-store` y fallo offline de assets estáticos.

### BUILD-001 — Dos lockfiles incompatibles (corregido)

- Severidad: **Corregida**
- Evidencia actual: el repositorio conserva únicamente `package-lock.json` y la automatización utiliza npm.
- Verificación: `npm ci --dry-run --ignore-scripts` valida la sincronización de manifiesto y lockfile.

### TEST-001 — Cobertura insuficiente para reglas críticas

- Severidad: **Media**
- Ubicación: `src/**/*.test.ts(x)`, `backend/tests/**`
- Evidencia: existen 13 pruebas frontend y 11 pruebas backend con 62 aserciones. Ya hay regresiones directas del motor de horarios, persistencia de sesión local y política del service worker; aún faltan autorización administrativa completa, persistencia funcional, importación transaccional, permutas y navegación E2E.
- Impacto: el build puede estar verde mientras fallan reglas laborales, sincronización o controles de permiso.
- Corrección: pruebas de servicios/backend, integración con DB real de prueba, regresiones del scheduler, autorización por rol y E2E de los flujos críticos.

## Controles positivos comprobados

- TypeScript compila sin errores y el build de producción termina correctamente.
- Las 13 pruebas frontend y las 11 pruebas backend (62 aserciones) pasan.
- PHPStan nivel 8 analiza la API sin errores y todos los archivos PHP pasan validación sintáctica.
- `npm audit` y `composer audit` reportan 0 vulnerabilidades conocidas.
- `npm audit signatures` no reporta firmas inválidas ni ausentes.
- `npm ci --dry-run --ignore-scripts` confirma consistencia entre `package.json` y `package-lock.json`.
- No se encontraron patrones de claves privadas, tokens de proveedor o API keys en archivos rastreados.
- No se encontraron `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` ni `postMessage` inseguros en el código de aplicación.
- Los esquemas Zod son estrictos, limitan tamaños y validan los respaldos antes de importarlos.
- Los IDs nuevos usan `crypto.randomUUID()`.
- Las configuraciones Apache y Nginx incluyen CSP restrictiva, protección contra framing, `nosniff`, Referrer Policy y Permissions Policy.
- El selector rápido de usuarios y la lista de PIN de prueba están condicionados a `import.meta.env.DEV`; el texto de perfiles de prueba no aparece en el bundle de producción.
- La migración fue probada con MariaDB 11.4 en el ciclo completo `migrate -> rollback -> migrate`, verificando 4 tablas, 6 índices de usuario y 3 claves foráneas.
- La API almacena hashes Argon2id y tokens de sesión/CSRF opacos; los identificadores de sesión se guardan hasheados y la cookie es `HttpOnly`, `SameSite=Strict` y `Secure` bajo HTTPS.

## Verificaciones pendientes fuera del repositorio

No es posible afirmar que las cabeceras estén activas en `zgamersa.com` solo por existir configuraciones de ejemplo. El servidor local Vite Preview no entrega CSP, `X-Frame-Options`, `nosniff`, Referrer Policy ni Permissions Policy, lo cual es normal para esa herramienta. Antes de publicar se debe verificar por HTTPS la respuesta real del hosting y confirmar que Apache permita `mod_headers`/`.htaccess` o que el proxy equivalente establezca estas cabeceras.

## Orden recomendado de remediación

1. ~~Bloquear el acceso administrativo predeterminado~~ (completado) y retirar cualquier afirmación de “PIN criptográfico”.
2. ~~Diseñar backend, contrato API y modelo de base de datos~~ (cimiento completado) antes de exponer la aplicación a trabajadores reales.
3. Integrar la autenticación de servidor ya creada y ampliar RBAC a cada endpoint funcional.
4. Migrar datos a la base central con transacciones y auditoría inmutable.
5. Integrar React con la API y convertir `localStorage` en cache no sensible, nunca fuente de autoridad.
6. ~~Restringir el service worker y unificar lockfile~~ (completado); continuar ampliando pruebas funcionales y E2E.
7. Validar HTTPS y cabeceras sobre el dominio real antes del lanzamiento.

## Conclusión

Frontend, build, backend de autenticación y migración SQL funcionan de forma aislada, pero **la interfaz todavía no está sincronizada con la API ni con la base de datos central**. La seguridad visual y las validaciones Zod son útiles, pero el modelo local heredado no protege identidades ni datos frente a un usuario del navegador. El siguiente paso obligatorio es integrar React con la API, provisionar el administrador inicial de forma segura y migrar los módulos funcionales antes de considerar producción.

## Referencias primarias

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
