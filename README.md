# Creciendo Cuento a Cuento

Aplicación web para generar cuentos personalizados con IA para niños. Los usuarios crean perfiles con personajes (familia, amigos, mascotas), eligen género, lugar, idioma y duración, y la IA genera un cuento a medida que se puede leer en pantalla o descargar en PDF.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **IA:** Anthropic Claude (claude-sonnet-4-6) vía streaming SSE
- **Base de datos:** Supabase (PostgreSQL)
- **Auth:** JWT personalizado con códigos de acceso
- **i18n:** next-intl (ES, CA, GL, EN, FR, PT, NL, DE, AR, UR, RU)
- **PDF:** pdfmake + envío por email con Resend
- **Deploy:** Vercel (Pro — timeout 300s)

## Desarrollo local

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # vitest (unit tests)
npm run e2e       # playwright (e2e)
```

Variables de entorno necesarias en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
JWT_SECRET=
RESEND_API_KEY=
ADMIN_CODE=
```

## Arquitectura de generación de cuentos

La ruta `POST /api/generate-story` usa **streaming SSE** para evitar timeouts en cuentos largos:

1. El servidor llama a `anthropic.messages.stream()` y envía cada fragmento de texto al cliente en tiempo real con el formato `data: {"chunk": "..."}\n\n`.
2. Cuando Claude termina, el servidor guarda el cuento en Supabase y envía `data: {"done": true, "id": "..."}\n\n`.
3. El cliente (`StoryForm.tsx`) lee el stream con `ReadableStream.getReader()` y redirige a `/cuento/:id` al recibir el evento `done`.

Esto mantiene la conexión viva durante toda la generación (hasta 300s en Vercel Pro) sin bloquear el servidor.

---

## Registro de cambios

### 2026-05-21 — Fix generación: streaming SSE + timeout 300s
- **Problema:** cuentos con muchos personajes o duración larga provocaban `"Failed to fetch"` porque la llamada bloqueante a Claude superaba el timeout de 60s de Vercel.
- `src/app/api/generate-story/route.ts`: cambiado `messages.create()` por `messages.stream()`, la ruta ahora devuelve una respuesta SSE en lugar de JSON.
- `src/components/story/StoryForm.tsx`: el cliente lee el stream SSE con `ReadableStream.getReader()` en lugar de `await res.json()`.
- `vercel.json`: `maxDuration` aumentado de 60s a 300s. `export const maxDuration = 300` añadido en el route file.

### 2026-05-21 — Fix error `[object Object]` en generación
- **Problema:** cuando la validación del schema fallaba (p.ej. demasiados personajes), la API devolvía un objeto Zod como `data.error`. Al hacer `new Error(objeto)` se mostraba `[object Object]` en pantalla.
- `src/app/api/generate-story/route.ts`: límite de personajes ampliado de `max(5)` a `max(10)` (el UI no tenía restricción).
- `src/components/story/StoryForm.tsx`: el manejo de errores ahora comprueba si `data.error` es string u objeto, extrayendo mensajes legibles de `fieldErrors` y `formErrors`.

### 2026-05-21 — Traducciones completas en todos los idiomas
- Todos los textos hardcodeados de la UI traducidos a los 9 idiomas soportados.

### 2026-05-19 — Idioma ruso
- Añadido ruso (`ru`) como idioma de UI y de generación de cuentos.

### 2026-05-19 — Aumento longitud código de acceso
- `maxLength` del input de código de acceso aumentado de 22 a 50 caracteres.

### 2026-05-19 — Idioma portugués
- Añadido portugués (`pt`) como idioma de UI y de generación de cuentos.

### 2026-05-19 — Fix IDs de personajes no UUID
- La validación de `generate-story` aceptaba solo UUIDs como `id` de personaje; corregido para aceptar cualquier string.

### 2026-05-18 — Panel de administración
- Panel `/admin` con estadísticas filtrables, tabla de perfiles y biblioteca global de cuentos.

### 2026-05-18 — Envío de PDF por email
- Botón "Enviar PDF por email" en la vista de cuento usando Resend.
- El PDF incluye la etiqueta del administrador (nombre de familia).

### 2026-05-17 — Géneros literarios reales, separación género/lugar
- `StoryForm` separa los campos de género y lugar en pasos distintos.
- Géneros literarios reales en lugar de categorías genéricas.
- Nivel C2 renombrado.

### 2026-05-17 — Seguridad: cookie admin, revocación de sesión, fuga de metadata
- Fix cookie de admin, revocación correcta de sesión y eliminación de fuga de metadata.

### 2026-05-16 — i18n completo (ES/EN/CA/GL) + PDF + hero
- Internacionalización completa de `StoryForm`, `CharacterManager` y selector de idioma.
- Soporte francés, árabe y urdu con RTL.
- Rediseño del hero con ilustración.
- PDF mejorado.

### 2026-05-15 — Setup inicial v2
- Proyecto Next.js con autenticación por código de acceso, perfiles, generación de cuentos con Claude y lectura en pantalla.
