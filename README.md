# JOTAPE WEB 5.1 — Netlify + Gemini Live

Proyecto de publicación permanente de JOTAPE: CRT, nueve sprites de giro, flotación, parpadeos y procesamiento robótico de voz. El navegador habla directamente con Gemini Live mediante un **token efímero** que obtiene de una Netlify Function. No necesita tener tu Mac prendida.

## Opción recomendada: publicación desde GitHub (sin terminal después de subir el repositorio)

1. Descomprimí el ZIP y subí la **carpeta completa** a un repositorio privado de GitHub (NO incluyas ninguna API Key ni archivo `.env`).
2. En Netlify elegí **Import a Git repository → GitHub** y seleccioná el repo.
3. Netlify detectará `netlify.toml`: build `npm run build`, carpeta `dist`, funciones `netlify/functions`.
4. Dentro de Netlify, **Project configuration → Environment variables**, creá `GEMINI_API_KEY` con tu clave de Google AI Studio. Marcá alcance **Functions** o **All**.
5. Opcional: `JOTAPE_ACCESS_CODE` para restringir pruebas a invitados, y `GEMINI_LIVE_MODEL` para seleccionar modelo.
6. Hacé **Trigger deploy → Deploy site** luego de configurar las variables. No pegues la clave en el código ni la compartas.
7. Abrí el dominio `*.netlify.app` con Chrome o Safari, habilitá el micrófono e iniciá conexión.

## Opción rápida con Terminal (sin GitHub)

`npm install`
`npx netlify login`
`npx netlify deploy --build --prod`

La primera vez asociá/creá un sitio. Configurá `GEMINI_API_KEY` en el panel de Netlify y volvé a desplegar. **Para publicar junto con las funciones, usá este método o Git**; NO subas únicamente `index.html` o el ZIP del prototipo anterior al recuadro de archivos estáticos.

## Comprobación

`https://TU-SITIO.netlify.app/api/status` debe mostrar `online:true` y `configured:true`. Solo confirma la configuración, no que la conversación Live funcione.

## Advertencias

- El nivel gratuito de Gemini tiene cuotas; una web pública sin limitación de sesiones puede agotar la cuota.
- El código compartido no es seguridad fuerte ni protege contra abuso deliberado. Para apertura pública real se necesita autenticación y rate limiting robusto, y quizás Turnstile.
- Gemini Live usa internet y permiso de micrófono con HTTPS; algunos dispositivos pueden necesitar un gesto inicial para activar el audio.
- El modelo de Live puede cambiar de nombre/disponibilidad: configurá `GEMINI_LIVE_MODEL` según tu cuenta.
- Esta migración se verificó estáticamente, pero no se probaron llamadas reales a Gemini ni el deploy dentro de tu cuenta.
