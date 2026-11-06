# JOTAPE Android A26 1.0

Esta es la **versión PWA instalable** derivada de JOTAPE WEB 5.3. Conserva Gemini Live, interfaz CRT, sprites pixel art, flotación, parpadeo y boca reactiva. No es un APK compilado manualmente. En Samsung Galaxy A26, Chrome puede instalarla como WebAPK desde el sitio HTTPS publicado.

## Publicación

1. Extraé este ZIP. Subí **el contenido** al repositorio GitHub `jotape-web`, conservando la estructura de carpetas. No subas `.env` ni claves de API.
2. Esperá que Netlify termine el nuevo Deploy con estado Published. `GEMINI_API_KEY` sigue almacenada en Netlify, no se añade al código.
3. En el Samsung Galaxy A26, abrí Chrome y visitá la URL de tu JOTAPE publicada en Netlify.
4. Menú de Chrome (⋮) > **Instalar app** o **Agregar a pantalla principal**, según lo que muestre. Confirmá.
5. Abrí JOTAPE desde su ícono, pulsá INICIAR CONEXIÓN y autorizá micrófono.

## Importante

- El rostro, los sprites y la interfaz se pueden cachear; **Gemini requiere conexión permanente** para hablar.
- La instalación de Chrome se hace con un WebAPK/PWA, no con un instalador APK proporcionado en este ZIP.
- No hay una compilación Android nativa; para una APK distribuible por archivo o por Play Store se requiere un paso adicional de TWA/Bubblewrap y firmar la aplicación.
- La conexión con Gemini utiliza la API Key de Netlify mediante un token temporal, no se inserta la clave en el dispositivo.
- No se han hecho pruebas reales en un Galaxy A26. Verificar acceso a micrófono y reproducción de audio en el propio equipo.
