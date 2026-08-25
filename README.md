# GarzónTurnos Pro

Aplicación React/TypeScript para planificación de turnos, rotación equitativa de zonas de aseo, solicitudes de cambio y seguimiento operativo del equipo de sala.

## Inicio rápido

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://127.0.0.1:3000`.

## Comandos

- `npm run dev`: desarrollo local limitado al equipo actual.
- `npm run dev:lan`: desarrollo accesible desde la red local.
- `npm run check`: contrato integral; valida frontend y backend, ejecuta pruebas y genera el build.
- `npm run check:frontend`: tipos, pruebas React y build de producción.
- `npm run check:backend`: Composer, auditoría de dependencias y pruebas PHP.
- `npm run check:contract`: validación reproducible del contrato OpenAPI.
- `npm run build`: genera el sitio estático en `dist/`.
- `npm run preview`: prueba local del paquete de producción.

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para preparar `zgamersa.com`.

## Estado de arquitectura

La interfaz y las reglas actuales siguen funcionando con almacenamiento local durante la migración. El directorio `backend/` contiene el primer cimiento seguro de API, sesiones, CSRF y base SQL, pero React todavía no consume esos endpoints. Hasta completar esa integración, el sistema no debe considerarse listo para producción multiusuario.

La decisión arquitectónica está documentada en [ADR-001](./docs/adr/ADR-001-backend-php-mysql.md) y el contrato HTTP en [OpenAPI](./docs/api/openapi.yaml).
