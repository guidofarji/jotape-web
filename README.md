# JOTAPE WEB 5.3 — Pixel Art (Netlify)

Versión responsive de la obra artística JOTAPE. Mantiene Gemini Live, voz con efecto robótico, la interfaz arcade ochentosa, el servidor de tokens temporales y los controles existentes. **No usa Ollama ni Whisper.**

## Cambios

- Nuevo rostro pixel-art 8 bits: cabeza turquesa, sin chapa en la frente y ojos verde oscuro.
- 9 archivos PNG de giro, generados a partir de la hoja aprobada, con fondo transparente. Los extremos se repiten para evitar cortes de silueta en la plancha original; los movimientos automáticos usan el tramo central (vistas 3 a 7).
- Tres sprites de expresión para parpadeo (`jotape_blink_open/dim/off.png`).
- Flotación, giro lateral, boca reactiva a la voz y parpadeo automático.
- Layout adaptable: consola horizontal para escritorio/tablet, vertical para teléfono.

## Actualizar el proyecto publicado

Tu repositorio GitHub `jotape-web` está vinculado a Netlify. **No crees otro proyecto ni cambies `GEMINI_API_KEY`.**

Reemplazá o añadí estos archivos respetando su ubicación:

- `index.html`
- `src/main.js`
- `src/style.css`
- `package.json`
- `public/sprites/` (los doce archivos PNG; subirlos dentro de la carpeta `sprites` de `public`)

Los archivos `netlify.toml` y `netlify/functions/` ya son compatibles: mantenerlos. Tras confirmar los cambios con `Commit changes`, Netlify vuelve a publicar automáticamente.

Si GitHub no reemplaza archivos cuando los arrastrás, entrá a cada archivo y usá el editor o GitHub Desktop para sincronizar la carpeta completa.

## Configuración

`GEMINI_API_KEY` debe seguir configurada como **variable secreta de producción** en Netlify, no en el código ni en GitHub. Consultá `netlify/functions/token.mjs` antes de compartir públicamente: las sesiones abiertas pueden consumir cuota de Gemini.

## Desarrollo local (opcional)

```bash
npm install
npm run build
```

El resultado es `dist/`, publicado automáticamente por Netlify. La apariencia de sprites se puede ver sin conexión, pero hablar con Gemini requiere internet, clave y cuota.
