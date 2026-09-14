# Acuatic Paradise — Calendario

Calendario compartido del equipo para **Acuatic Paradise** (salón de eventos con alberca en Pachuca). Una sola app en **Expo + React Native** que corre en **web** y se empaqueta como **APK de Android**. El backend es **Supabase** (Auth, Postgres y Realtime).

Las tres personas del staff ven y editan las **mismas** visitas y eventos. Los cambios se reflejan al instante.

## Qué incluye

- Inicio de sesión (**usuario + contraseña**; sin correo en la interfaz)
- Vistas **día**, **semana** y **mes**
- **Visitas** de clientes: nombre, teléfono (opcional), tipo de servicio, fecha/hora, duración, notas y estado (`programada` / `completada` / `cancelada` / `no asistió`)
- **Eventos** internos (mantenimiento, juntas, cierres): título, fecha/hora, duración, notas — visualmente distintos (coral vs. aqua)
- Sincronización en tiempo real con Supabase Realtime
- Paleta navy / sky / aqua / coral, interfaz 100 % en español

## Requisitos

- Node.js 20+ (recomendado 22)
- Cuenta en [Supabase](https://supabase.com)
- Para APK: cuenta Expo y [EAS CLI](https://docs.expo.dev/build/setup/)

## 1. Crear el proyecto de Supabase

1. Entra a [https://supabase.com/dashboard](https://supabase.com/dashboard) y crea un proyecto (región cercana, p. ej. `East US`).
2. Abre **SQL Editor** y pega, en orden:
   - `supabase/migrations/20260914120000_init.sql`
   - `supabase/migrations/20260914130000_profiles_username.sql` (si ya corriste solo el init anterior, ejecuta este; si es proyecto nuevo y el init ya incluye `username`, también es seguro)
   - `supabase/seed.sql`
3. En **Authentication → Providers** deja **Email** activado (Supabase Auth lo usa por debajo). Desactiva **Confirm email** mientras configuras al equipo (así pueden entrar de inmediato).
4. Crea las **3 cuentas del staff** solo desde el dashboard de Supabase (no hay registro en la app). Ver sección siguiente.
5. Copia las llaves en **Project Settings → API**:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Cuentas del staff (usuario, no correo real)

La app pide **Usuario** y **Contraseña**. Por debajo, Supabase Auth sigue usando email: cada usuario se mapea a un correo sintético:

`usuario` → `usuario@acuaticparadise.com`

(normalizado: minúsculas, sin espacios; solo letras, números, `_` y `.`)

**No hay pantalla de registro.** Crea las 3 cuentas en **Authentication → Users → Add user** con estos correos sintéticos y la contraseña que elijan:

| Usuario en la app | Email a crear en Supabase Auth      | Contraseña        |
|-------------------|-------------------------------------|-------------------|
| `ana`             | `ana@acuaticparadise.com`         | (la que elijan)   |
| `luis`            | `luis@acuaticparadise.com`        | (la que elijan)   |
| `maria`           | `maria@acuaticparadise.com`       | (la que elijan)   |

El trigger `handle_new_user` crea la fila en `profiles` (incluye `username` = local-part del email). En la app, Ana inicia sesión con usuario `ana` y su contraseña — nunca ve el correo.

Opcional: tras crear cada usuario, en **Table Editor → profiles** puedes poner un `full_name` amigable (p. ej. `Ana`).

## 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Nunca subas `.env` al repositorio. Expo lee automáticamente las variables que empiezan con `EXPO_PUBLIC_`.

## 3. Correr en web (local)

```bash
npm install
npx expo start --web
```

También puedes usar `npm run web`. Abre la URL que imprime Metro (por defecto `http://localhost:8081`).

En Android físico o emulador:

```bash
npx expo start
```

y escanea el QR con Expo Go, o pulsa `a`.

## 4. Generar APK

### Opción A — EAS Build (recomendada)

```bash
npm i -g eas-cli
eas login
eas init
eas build -p android --profile preview
```

El perfil `preview` de `eas.json` genera un **APK** instalable. Asegúrate de definir las env vars en EAS (o un archivo `eas.json` + secretos):

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://TU-PROYECTO.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "TU-ANON-KEY"
```

O crea `eas.json` env por perfil. En SDK reciente también puedes usar un `.env` local con `eas build --profile preview` si las marcas como públicas.

### Opción B — Prebuild local

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/`. Requiere Android SDK / JDK.

## Estructura

```
app/                    pantallas (Expo Router)
  login.tsx             inicio de sesión (usuario + contraseña)
  (app)/index.tsx       calendario (día / semana / mes)
  (app)/visita/         alta y edición de visitas
  (app)/evento/         alta y edición de eventos
  (app)/perfil.tsx      cuenta y cierre de sesión
src/                    tema, hooks, componentes
  lib/authUsername.ts   mapeo usuario → email sintético
supabase/migrations/    tablas + RLS + Realtime
supabase/seed.sql       visitas y eventos de ejemplo
```

## Modelo de datos (resumen)

| Tabla     | Uso                                      | RLS                         |
|-----------|------------------------------------------|-----------------------------|
| profiles  | Nombre / username del staff (`auth.users`) | Lectura de todos; update propio |
| visits    | Citas / visitas de clientes              | CRUD para `authenticated`   |
| events    | Eventos internos del salón               | CRUD para `authenticated`   |

No hay dueño por fila: **todo el equipo comparte el mismo calendario**.

## Marca

- Nombre: Acuatic Paradise
- Paleta: navy `#0B1F3A`, aqua `#14C4C8`, sky `#2B7BBF`, coral `#FF6B4A`
- Sitio público: [quintaparaiso.com.mx](https://quintaparaiso.com.mx/)

## Licencia

Uso interno de Acuatic Paradise.
