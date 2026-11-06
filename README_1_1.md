# JOTAPE ANDROID 1.1 — modo conversación inmersivo

Se parte de la versión `JOTAPE_ANDROID_A26_1_0` sin cambiar la conexión segura de Gemini Live, sus funciones Netlify, voz robótica, prompts ni sprites originales.

## Cambios

- Al establecerse la conexión, el entorno retro desaparece y queda **la cabeza grande centrada en fondo negro puro**.
- Estado pequeño abajo (TE ESCUCHO / JOTAPE ESTÁ HABLANDO).
- **CERRAR SESIÓN** pequeño, centrado abajo. Al cerrarlo, vuelve la interfaz original.
- Solicita **Screen Wake Lock** al tocar iniciar; lo libera al cerrar y lo reacquire cuando la página vuelve a ser visible.
- Solicita modo pantalla completa de manera progresiva. **Android puede seguir mostrando la barra del sistema**, dependiendo del navegador y la configuración de gestos. Una APK con modo inmersivo nativo ofrece mayor control.
- Sigue funcionando en navegadores de otras plataformas y como PWA Android.
- Corrección de caché: `jotape-static-a26-v1-1`.

## Publicar

1. Respaldar los archivos actuales del repositorio y reemplazar por el contenido del ZIP, **manteniendo variables de entorno de Netlify** (`GEMINI_API_KEY`, etc.).
2. Confirmar los cambios en `main` de GitHub; Netlify realiza el build Vite y publica `dist`.
3. En Galaxy A26, cerrar y volver a abrir JOTAPE; si quedó la versión anterior, actualizar/reinstalar la PWA desde Chrome.
4. Probar inicio, permisos de micrófono, sesión, audio de Gemini y cierre. Wake Lock solo funciona bajo HTTPS y puede ser revocado por Android (ahorro de batería, bloqueo o cambio de app).

**Nota:** La web no puede prometer ocultar totalmente la barra de navegación de Android. La PWA no es una APK nativa.
