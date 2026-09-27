# AGENTS.md — Le Petit Can (Guía para continuar el desarrollo)

> Este archivo contiene el contexto completo de la sesión anterior para que cualquier agente (o humano) pueda continuar sin repetir trabajo. Léelo completo antes de tocar nada.

---

## 1. Qué es la app

**Le Petit Can** es una app web de gestión para una peluquería canina ("Atelier Canino") de alta gama. La dueña es **Iliana** y su equipo es **no técnico**. El objetivo de negocio es que puedan gestionar citas, clientes, mascotas, mensajería omnicanal y pagos/facturación con el mínimo mantenimiento posible.

Necesidades clave del cliente:
- **Bandeja omnicanal** (WhatsApp, Instagram, Facebook) unificada dentro de la app.
- **Gestión de citas, clientes y mascotas** con persistencia real.
- **Facturación conforme a normativa española** (los usuarios decidieron usar Odoo para esto).
- **Mínimo mantenimiento y mínima fricción técnica** para un equipo no técnico.

---

## 2. Stack tecnológico

- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + `motion` (framer) + `lucide-react`.
- **Auth:** Firebase Authentication **solo como login** (Google Sign-In). **NO se usa Firestore** (fue eliminado).
- **Bandeja omnicanal:** Chatwoot **Cloud** (SaaS). Ya están conectados WhatsApp, Facebook e Instagram vía Embedded Signup.
- **Base de datos de negocio:** **Odoo 17.0 Community** self-hosted en un VPS, versión congelada (no se actualiza).
- **Capa de integración / puente:** **n8n 2.2.3** self-hosted (instancia `n8n-test`). Todo el tráfico entre frontend, Chatwoot y Odoo pasa por webhooks de n8n.
- **Deploy:** **GitHub Pages** (repo público) vía GitHub Actions.

**Arquitectura:**

```
Frontend (React, GitHub Pages)
   │  HTTPS + header "X-App-Secret"
   ▼
n8n (VPS, instancia n8n-test)
   ├──► Chatwoot Cloud (API) — bandeja de mensajes
   └──► Odoo 17.0 (XML-RPC, red interna Docker) — datos de negocio
```

El frontend **nunca** habla directo con Odoo ni con Chatwoot. Siempre pasa por n8n.

---

## 3. Estructura de carpetas (relevante)

```
app-lepetitcan-chatwoot/
├── .github/workflows/deploy.yml       # Deploy a GitHub Pages
├── .env.example                       # Plantilla de variables de entorno
├── vite.config.ts                     # base: "/app-lepetitcan-chatwoot/"
├── tsconfig.json                      # types: ["vite/client"]
├── firebase-applet-config.json        # Config Firebase (solo Auth)
├── src/
│   ├── App.tsx                        # Enrutamiento + estado + handlers principales
│   ├── types.ts                       # Interfaces: Owner, Pet, Appointment, ChatThread...
│   ├── firebase.ts                    # Solo Auth (googleSignIn, logoutGoogle, initAuth)
│   ├── tokens.ts                      # Design tokens (colores, fuentes)
│   ├── services/
│   │   ├── chatwootService.ts         # Llama a webhooks n8n de Inbox / Send Message
│   │   └── odooService.ts             # Llama a webhooks n8n de Odoo + transformadores
│   ├── context/
│   │   └── MetaChannelsContext.tsx    # Almacena config de canales (localStorage)
│   ├── components/
│   │   ├── BookingWidget.tsx          # Widget de agendamiento (4 fases)
│   │   ├── ClientDetailView.tsx       # Fichas de clientes + mascotas + historial
│   │   ├── CalendarView.tsx           # Calendario de citas
│   │   ├── MessagingView.tsx          # Bandeja omnicanal (Chatwoot vía n8n)
│   │   ├── DashboardView.tsx, AnalyticsView.tsx, AdminManagementView.tsx...
│   │   └── WebhookHelper.ts           # Helpers de webhook (ya no usa Firestore)
│   └── views/
│       └── OmnichannelIntegrationView.tsx  # OBSOLETO (ya no se usa)
```

---

## 4. Decisiones importantes y por qué

1. **n8n como puente único** (no un backend custom). Motivo: el dueño se retiró del sector técnico y su equipo no técnico necesita algo mantenible. n8n tiene interfaz visual y nodos nativos (Odoo, HTTP Request, Webhook).

2. **Chatwoot Cloud en vez de self-hosted.** Motivo: evitar mantenimiento de Docker/Postgres/Redis/SSL/migraciones.

3. **Odoo en vez de Firestore.** Motivo: el negocio necesita facturación y gestión de datos robusta. Firestore se eliminó por completo (solo queda Firebase Auth para login). Los datos ahora viven en Odoo.

4. **Mascotas modeladas como "contacto hijo" en Odoo.** En `res.partner`, cada mascota es un `res.partner` con `parent_id` apuntando al contacto dueño. Los datos extra de la mascota (raza, tamaño, comportamiento, fecha nacimiento) se guardan:
   - `name` = nombre de la mascota
   - `function` = raza
   - `comment` = JSON string con `{size, behavior, birthDate}` (⚠️ Odoo lo devuelve envuelto en `<p>...</p>`, el frontend lo limpia con regex antes de `JSON.parse`).

5. **Firebase Auth solo para login** (decisión del usuario: prioridad "0 mantenimiento"). No hay usuarios en Odoo para el equipo; Odoo solo tiene un usuario técnico API para n8n.

6. **Versión de Odoo congelada (17.0), n8n congelada (2.2.3).** Motivo: el usuario no quiere lidiar con migraciones. Se asumieron riesgos operativos (ver sección de riesgos).

7. **Facturación completa con Odoo** (no "registro simple de pagos"). Motivo: Odoo ya trae `account` + `l10n_es`; genera facturas con IVA y numeración legal sin coste extra. **Aviso importante:** Odoo NO es software "homologado" por AEAT; para un negocio B2C pequeño el riesgo es bajo, pero el usuario fue avisado de consultar con su gestor.

---

## 5. Workflows de n8n (instancia `n8n-test`)

**URL base:** `https://n8n-n8n-test.hmrhwx.easypanel.host/webhook/`

Todos los webhooks usan **Header Auth** con el header `X-App-Secret`.

| Workflow | Path | Método | Función |
|---|---|---|---|
| Inbox (Chatwoot) | `/inbox` | GET | Lista conversaciones de Chatwoot |
| Send Message (Chatwoot) | `/send-message` | POST | Envía mensaje a una conversación |
| Get Contacts | `/get-contacts` | GET | Lista dueños + sus mascotas (hijos) |
| Create Contact | `/create-contact` | POST | Crea contacto (dueño) |
| Update Contact | `/update-contact` | POST | Actualiza contacto |
| Delete Contact | `/delete-contact` | POST | Elimina contacto |
| Create Pet | `/create-pet` | POST | Crea mascota como contacto hijo |
| Get Appointments | `/get-appointments` | GET | Lista citas (calendar.event) |
| Create Appointment | `/create-appointment` | POST | Crea cita |
| Create Payment | `/create-payment` | POST | Crea factura (account.move / "Journal Entry") |
| Health Check | `/health-check` | GET | Verifica conexión a Odoo |
| Backup DB | (Schedule) | — | Backup diario 3AM vía nodo Postgres |

### Detalles importantes de los workflows

- **Get Contacts** usa el nodo Odoo con Resource `Contact`, Operation `Get Many`, y un **nodo Code** que:
  1. Filtra `is_company` (excluye "My Company").
  2. Separa contactos con `parent_id` (son mascotas) de los que no lo tienen (dueños).
  3. Agrupa mascotas dentro de `owner.pets`.
  4. Devuelve `{ data: [...] }`.
  - Requiere que el nodo Odoo liste los campos `id, name, email, phone, mobile, parent_id, is_company, street, city, zip, function, comment`.

- **Patrón clave para que el webhook devuelva ARRAYS completos:** el nodo Code debe devolver `return [{ json: { data: items.map(i => i.json) } }]` y el nodo **Respond to Webhook** con `Response Body = {{ $json.data }}`. Si no, n8n devuelve solo el primer item (esto causó un bug largo).

- **Create Contact** usa Resource `Contact` con campos limitados (n8n 2.2.3 solo expone: name, email, mobile, phone, address, internal notes, job position, Tax ID, Website). El frontend envía con expresiones `={{ $json.body.name }}`, etc.

- **Create Appointment** usa Custom Resource `Calendar Event` (modelo `calendar.event`), Operation `Create`, campos: name, start, stop, duration, partner_id, description. El "state" se llama "Current Status" en la UI de n8n 2.2.3.

- **Create Payment** usa Custom Resource `Journal Entry` (modelo `account.move`), Operation `Create`, con `move_type = out_invoice`.

- Los nodos HTTP Request de Chatwoot usan credentials tipo `Chatwoot Token` con header `api_access_token`.

---

## 6. Cómo encajan n8n y el frontend

- `src/services/chatwootService.ts` tiene constantes `BASE` y `APP_SECRET` que leen de `import.meta.env.VITE_N8N_BASE_URL` y `VITE_APP_SECRET` (con fallback hardcodeado). Se inyectan vía **GitHub Secrets** en el workflow de deploy.
- `src/services/odooService.ts` envuelve todos los webhooks de Odoo con funciones tipadas: `getContacts()`, `createContact()`, `updateContact()`, `deleteContact()`, `createPet()`, `getAppointments()`, `createAppointment()`, `createPayment()`, `healthCheck()`.
  - Además tiene transformadores: `partnerToOwner(raw)`, `appointmentToAppointment(raw)`.
  - La función `get()` usa `unwrap()` para quitar el wrapper `{ json: {...} }` de n8n, y limpia HTML tags del campo `comment`.
- **`App.tsx`** carga datos desde Odoo en un `useEffect` de montaje (con fallback a localStorage), y sus handlers (`handleSaveOwner`, `handleDeleteOwner`, `handleBookingCreated`, etc.) llaman a Odoo vía `odooService` y además guardan en localStorage como cache.

---

## 7. Qué está terminado

- ✅ Firebase: eliminada toda dependencia de Firestore. Solo queda Auth.
- ✅ `chatwootService.ts` y `odooService.ts` creados y conectados a n8n.
- ✅ Todos los workflows de n8n creados y operativos (Chatwoot + Odoo).
- ✅ Listar contactos desde Odoo (dueños + mascotas agrupadas).
- ✅ Crear / actualizar / eliminar contactos (persiste en Odoo).
- ✅ Crear mascotas (persiste como contacto hijo en Odoo).
- ✅ Crear citas desde la app → se guardan en `calendar.event` de Odoo.
- ✅ Calendario muestra la fecha real (antes hardcodeada a 20/06/2026).
- ✅ Selector de contacto existente + mascotas en el BookingWidget (Fase 3).
- ✅ Eliminados textos/campos sobrantes (LOPD, "Canales de Mensajería", RGPD, "Duración Estimada", "Estado de Ficha").
- ✅ Avatares por defecto (iniciales) para contactos y mascotas.
- ✅ Deploy automático a GitHub Pages.
- ✅ `unattended-upgrades`, `logrotate` configurados; SSL vía Traefik.

---

## 8. Qué falta (priorizado)

1. **Historial de Servicios funcional.** La UI ya muestra el historial, pero falta conectar el flujo completo: cuando Iliana marca una cita como "Finalizada", debe registrarse en el historial del perro (fecha, servicio, duración, observaciones). El campo de notas es editable pero aún no persiste el cambio a Odoo.
2. **Pagos/facturas**: endpoint `create-payment` existe pero no está conectado a ninguna vista del frontend. Falta probar y pulir la creación de facturas con IVA/desglose correcto.
3. **Deduplicación de mascotas**: al guardar un contacto varias veces, se crean mascotas duplicadas en Odoo (se observaron ids 30/31/32 para "Monchi"). Falta detectar mascotas ya existentes antes de crear.
4. **Cita vinculada a contacto (partner_id)**: `handleBookingCreated` crea la cita pero aún no pasa el `partner_id` del contacto Odoo seleccionado (quedó un placeholder `undefined`).
5. **Mensajería de Chatwoot end-to-end**: los workflows Inbox/Send Message existen y la UI de `MessagingView` usa `chatwootService`, pero falta una prueba real de envío/recepción de un WhatsApp a través de todo el flujo.
6. **Subida de fotos de mascotas a Odoo**: por ahora solo hay avatares por defecto (iniciales). Falta persistir imágenes subidas (idealmente a `image_1920` de Odoo).
7. **Backup**: el workflow usa nodo Postgres y exporta tablas clave en JSON, pero no es un `pg_dump` restaurable. Falta verificar que realmente se ejecuta y decidir un storage externo (Google Drive/Dropbox).

---

## 9. Bugs conocidos

- **Campo `comment` de Odoo viene envuelto en HTML** (`<p>...</p>`). Ya se limpia con regex `replace(/<[^>]*>/g, "")` antes del `JSON.parse`. Si algún valor de mascota se pierde, revisar esto primero.
- **n8n webhook devuelve un solo item** si el nodo Respond to Webhook no está configurado para "All Incoming Items" o si el Code node no envuelve en `{ data: [...] }`.
- **Duplicación de mascotas/contactos** al re-guardar (ver sección "Qué falta" #3).
- **Error Odoo "Access to unauthorized or invalid companies"**: se resolvió añadiendo el usuario API a la compañía (`res_company_users_rel` con columna `cid`, no `company_id`).

---

## 10. Cosas que se probaron y NO funcionaron

- **Nodo "Execute Command" en n8n**: no está disponible en la instalación Docker configurada por Easypanel (por seguridad). Se reemplazó por el nodo **Postgres** para el backup.
- **Exportar workflows de n8n como JSON y que el usuario los importara**: el usuario prefirió crearlos manualmente en la UI, y además el nodo Odoo de n8n 2.2.3 tiene labels predefinidos ("Contact", "Journal Entry", "Calendar Event") que no coinciden con los nombres de modelo crudos, así que se crearon a mano.
- **Hardcodear el `X-App-Secret` y URLs en en el código fuente**: se cambió a variables de entorno `VITE_*` + GitHub Secrets para poder hacer el repo público sin exponer credenciales.
- **Usar GitHub Pages con repos privado**: no funciona en plan gratuito. Se hizo público.

---

## 11. Cómo correr y probar

### Desarrollo local
```bash
npm install
npm run dev        # sirve en http://localhost:3000
npm run build      # compila a /dist
npx tsc --noEmit   # typecheck (equivale al lint de este repo)
```

### Variables de entorno
Se necesitan (ver `.env.example`):
```
VITE_N8N_BASE_URL=https://n8n-n8n-test.hmrhwx.easypanel.host/webhook
VITE_APP_SECRET=<secreto>
```
En producción se inyectan como **GitHub Secrets** (`VITE_N8N_BASE_URL`, `VITE_APP_SECRET`).

### Login de prueba
La app usa `LoginView` con cuentas demo hardcodeadas:
- `iliana@lepetitcan.com` / `owner123` (Propietaria)
- `admin@lepetitcan.com` / `admin123` (Administrador)
- `peluquero@lepetitcan.com` / `work123` (Empleado)

### URL producción (GitHub Pages)
`https://galiciabot.github.io/app-lepetitcan-chatwoot/`

---

## 12. Credenciales y accesos

> ⚠️ **Las credenciales sensibles (tokens, contraseñas, secrets) NO están en este archivo** porque GitHub tiene "push protection" que bloquea commits con secretos, y este repositorio es público. Si necesitas acceder a infraestructura, pídele las credenciales al usuario (las tiene en el historial de la conversación). Aquí solo se documentan los identicadores no sensibles y cómo está montado el acceso.

### GitHub repo
- **Repo:** `galiciabot/app-lepetitcan-chatwoot` (público)
- Para hacer push se necesita un **token Personal Access Token** con permisos `Contents: read/write` y `Workflows: read/write`. GitHub expira estos tokens con frecuencia; si el push falla con 403, pide uno nuevo al usuario.
- Git remote:
  ```
  https://galiciabot:<TOKEN>@github.com/galiciabot/app-lepetitcan-chatwoot.git
  ```

### VPS (Contabo)
- **IP:** `207.180.237.107`
- **Usuario:** `root`
- **SO:** Ubuntu 24.04.3 LTS
- Acceso por SSH con contraseña (pedirla al usuario). Desde este entorno se usó `expect` porque `sshpass` no está instalado. Ver sección 13.

### n8n
- **URL test:** `https://n8n-n8n-test.hmrhwx.easypanel.host` — es la instancia que se usa para TODO (producción y test viven aquí).
- Los webhooks usan header `X-App-Secret` (el valor exacto lo tiene el usuario).

### Odoo (Docker en el VPS)
- **Contenedor Odoo:** `n8n_odoo-community.1.*` (Odoo 17.0)
- **Contenedor DB:** `n8n_odoo-db.1.*` (PostgreSQL 13)
- **Base de datos:** `agencia-galiciabot`
- **Host interno Docker (desde n8n):** `n8n_odoo-community:8069`
- **Usuario técnico API:** `api@lepetitcan.com` (contraseña la tiene el usuario)
- **Login admin de Odoo:** `suscripciones@galiciabot.org`

### Conexión por SSH desde este entorno
```bash
# `sshpass` no está disponible; se instaló `expect`. Asistente:
/tmp/ssh-exp.sh <IP> <usuario> <contraseña> "COMANDO"
# Para copiar archivos: usar scp + expect (ver historial de la sesión).
```

---

## 13. Riesgos operativos (para el equipo no técnico)

El usuario fue advertido de que **Odoo self-hosted NO es cero mantenimiento**. Se mitigó así:
- `unattended-upgrades` limitado a parches de seguridad (se comentó la línea `${distro_id}:${distro_codename}` para que solo aplique `-security`).
- SSL vía Traefik (Easypanel) — se renueva automáticamente.
- `logrotate` ya instalado.
- Backup diario 3AM vía n8n (nodo Postgres).
- Health check disponible en `/webhook/health-check`.

Queda pendiente: verificar que el backup realmente se ejecuta y decidir storage externo.

---

## 14. Estado del último commit

El último trabajo fue: **refactorizar el historial de mascotas** a "Historial de Servicios" (eliminando "Último reconocimiento", "Ver Informe de Cabina", filtro SPA/Premium, estados y "Tratamientos Aplicados"), y añadir un campo de notas editable. Se eliminaron estados no usados (`filterActive`, `historyLimit`) y se conservó `reportOpen` (el modal aún lo usa).

Compila y despliega correctamente. El siguiente paso natural es conectar la persistencia de las notas del historial y el flujo "cita Finalizada → historial del perro".