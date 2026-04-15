# Supabase / PostgreSQL

Este directorio deja la base lista para sacar la app de `localStorage` y pasarla a una base real.

## 1. Ejecutar el esquema

1. Crea un proyecto en Supabase.
2. Abre `SQL Editor`.
3. Pega y ejecuta [schema.sql](./schema.sql).

## 2. Crear tu primer admin

Después de registrarte en la app una vez, ejecuta esto en el SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-correo@ejemplo.com';
```

## 3. Qué guarda cada tabla

- `profiles`: perfil público y datos extra del usuario.
- `jobs`: ofertas creadas por admin.
- `hidden_jobs`: ids de ofertas locales ocultadas globalmente por admin.
- `communities`: comunidades creadas por usuarios.
- `saved_jobs`: ofertas guardadas por usuario.
- `saved_towns`: pueblos guardados por usuario.
- `notifications`: notificaciones globales o dirigidas.
- `notification_reads`: estado de lectura por usuario.
- `location_events`: tracking de ubicación con snapshot del perfil en el momento de captura.

## 4. Mapeo desde tu app actual

- `DB.saveProfile()` / `DB.getProfile()` -> `public.profiles`
- `DB.createJob()` / `DB.getCustomJobs()` -> `public.jobs`
- `DB.hideJob()` sobre ofertas locales -> `public.hidden_jobs`
- `DB.createCommunity()` / `DB.getCommunities()` -> `public.communities`
- `DB.toggleSavedJob()` -> `public.saved_jobs`
- `DB.toggleSavedTown()` -> `public.saved_towns`
- `DB.addNotification()` / `DB.getNotifications()` -> `public.notifications` + `public.notification_reads`
- `DB.recordUserLocation()` -> `public.location_events`

## 5. Qué se queda fuera

El catálogo grande de pueblos puede seguir en tus archivos `data/` por ahora. No hace falta meterlo ya en PostgreSQL para tener usuarios, ofertas, comunidades y tracking reales.

## 6. Importante

- No pongas la `service_role` en el frontend.
- Usa Supabase Auth para login y deja que el trigger cree el perfil en `public.profiles`.
- La app ya apunta a `https://haubnnuibewuzyxpgdoj.supabase.co`, pero en [js/supabase-config.js](../js/supabase-config.js) todavía tienes que poner tu `anon/publishable key`.
- Este esquema no cambia tu frontend automáticamente: solo deja la base preparada para conectarla.
