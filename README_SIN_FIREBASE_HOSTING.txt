NEXUS Versión 1 - Supabase PWA sin Firebase Hosting

Este paquete ya no usa Firebase Hosting ni Firestore.
La base de datos es Supabase/PostgreSQL.
La web puede subirse a GitHub Pages, Netlify, hosting propio, cPanel, Neocities u otro hosting estático con HTTPS.

ANTES DE SUBIR
Edita este archivo:
supabase-config.js

Debe quedar así:

window.NEXUS_SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
window.NEXUS_SUPABASE_ANON_KEY = "TU_ANON_PUBLIC_KEY";
window.NEXUS_SUPABASE_TEAM = "equipo_principal";

OPCIÓN RECOMENDADA: GITHUB PAGES

1. Entra a GitHub.
2. Crea un repositorio nuevo, por ejemplo:
   nexus-pwa
3. Sube TODOS los archivos de esta carpeta a la raíz del repositorio.
   Importante: index.html debe quedar en la raíz.
4. Ve a:
   Settings -> Pages
5. En Source selecciona:
   Deploy from a branch
6. Branch:
   main
7. Folder:
   /root
8. Save.
9. Espera unos minutos.
10. Abre la URL:
   https://TU-USUARIO.github.io/nexus-pwa/

INSTALAR COMO PWA EN ANDROID

1. Abre la URL en Chrome Android.
2. Menú de tres puntos.
3. Instalar aplicación o Agregar a pantalla principal.
4. Abre NEXUS desde el icono instalado.

PROBAR BASE

Entra con:
Usuario: admin
Contraseña: 1234

Crea usuario/tabla o registra un movimiento.
Luego revisa en Supabase:
Table Editor -> nexus_records
Table Editor -> nexus_audit

SI GITHUB PAGES NO ABRE EN CUBA

Prueba el mismo paquete en:
- Netlify con drag and drop
- Neocities
- hosting cPanel
- un VPS con Nginx
- cualquier hosting estático HTTPS

No hay dependencia de Firebase en este paquete.
