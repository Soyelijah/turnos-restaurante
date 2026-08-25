# Despliegue en zgamersa.com

La aplicación es un proyecto React/Vite independiente. No requiere ChatGPT Sites, Node.js ni un proceso residente en producción: el resultado de `npm run build` es el contenido estático de `dist/`.

## Desarrollo local

Requisitos: Node.js 22 o superior y npm.

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:3000`. Para probar desde otro equipo de la red local usa `npm run dev:lan`; no uses ese modo en una red pública.

## Verificación antes de publicar

```bash
npm ci
npm run check
npm audit
```

El paquete que se publica es únicamente la carpeta `dist/` generada por `npm run build`.

## Hosting Apache o cPanel

1. Ejecuta `npm ci && npm run build` en un entorno de compilación.
2. Sube el contenido interior de `dist/` al document root del dominio o subdominio.
3. Conserva `dist/.htaccess`; configura la raíz web para permitir `AllowOverride FileInfo Options` si administras Apache.
4. Activa HTTPS y fuerza la redirección HTTP → HTTPS desde el panel del hosting.
5. Comprueba `/`, `/manifest.webmanifest`, los assets y una recarga directa del navegador.

No subas el repositorio completo, `.env`, `src/`, `node_modules/` ni archivos de respaldo.

## Hosting Nginx

Usa `deploy/nginx.conf.example` como base, cambia `server_name` y `root`, activa el sitio y valida la configuración antes de recargar Nginx.

## Dominio

La configuración de ejemplo usa `turnos.zgamersa.com`. También puede publicarse en la raíz de `zgamersa.com`. Si finalmente se alojará en una subcarpeta, compila indicando la ruta:

```bash
VITE_BASE_PATH=/turnos/ npm run build
```

En ese caso también deben ajustarse `start_url`, el alcance del service worker y la regla de fallback a esa misma subcarpeta antes del despliegue.

## Límite de la versión actual

Los datos de turnos se guardan por navegador mediante almacenamiento local validado. Esto permite desarrollar y probar sin backend, pero no sincroniza distintos equipos. Antes de abrir el sistema a todos los trabajadores se debe incorporar autenticación real, API y base de datos central con autorización del lado servidor.
