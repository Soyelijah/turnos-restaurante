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
- `npm run check`: tipos, pruebas y build de producción.
- `npm run build`: genera el sitio estático en `dist/`.
- `npm run preview`: prueba local del paquete de producción.

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para preparar `zgamersa.com`.

## Estado de arquitectura

La interfaz y las reglas actuales funcionan sin servidor y validan los datos persistidos e importados. Para producción multiusuario todavía se requiere una API con autenticación, autorización y base de datos compartida; el almacenamiento del navegador no debe considerarse una base de datos central.
