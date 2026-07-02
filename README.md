# CRM AgroSol — Agrocentro Solá

CRM de logística para **Agrocentro Solá**. Gestión de órdenes, entregas, sucursales y pings en tiempo real.

Repositorio oficial: [github.com/mcdesignspur-svg/CRM-AgroSol-](https://github.com/mcdesignspur-svg/CRM-AgroSol-)

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL 16** + **Prisma**

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/` | Panel de logística — métricas, órdenes recientes, pings en vivo |
| `/ordenes` | Listado de órdenes |
| `/ordenes/[id]` | Detalle de una orden |
| `/ordenes/nueva` | Registro de nueva orden con retiro/entrega |
| `/productos` | Catálogo de productos |
| `/entregas` | Mapa, entregas activas, estado de sucursales |
| `/sucursales` | Vista de red y capacidad por sucursal |
| `/conductor` | Vista del conductor |

## Desarrollo local

### 1. Base de datos

Levanta PostgreSQL con Docker:

```bash
docker compose up -d
```

Copia las variables de entorno:

```bash
cp .env.example .env
```

La URL por defecto en `docker-compose` (credenciales **solo para desarrollo local**):

```
postgresql://agrosol:agrosol@localhost:5432/agrosol_crm?schema=public
```

### 2. Dependencias y migraciones

```bash
npm install
npm run db:migrate
npm run db:seed
```

### 3. Servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Scripts de base de datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:migrate` | Aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción (`prisma migrate deploy`) |
| `npm run db:seed` | Siembra sucursales iniciales y entregas de ejemplo |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:push` | Sincroniza schema sin migración (prototipado) |

### Calidad de código

| Comando | Descripción |
|---------|-------------|
| `npm run lint` | Ejecuta ESLint en el proyecto |
| `npm run typecheck` | Comprueba tipos con TypeScript (`tsc --noEmit`) |
| `npm test` | Ejecuta los tests unitarios con Vitest |

## Producción

```bash
npm run build
npm start
```

Requiere `DATABASE_URL` apuntando a una instancia PostgreSQL accesible.

### Deploy en Vercel

1. Conecta el repositorio de GitHub en [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Añade las variables de entorno en **Production**:
   - `DATABASE_URL` — URL de la app en runtime (en Neon, la URL **pooled** con `-pooler`)
   - `DIRECT_DATABASE_URL` — URL **directa** (sin `-pooler`), usada por el build para las migraciones. Las migraciones de Prisma necesitan conexión directa; a través del pooler fallan con timeout (`P1002`).
4. En **Settings → Environments → Production**, confirma:
   - **Production Branch**: `main`
   - **Auto-assign Custom Production Domains**: activado (cada push a `main` va directo a producción)
5. Ejecuta migraciones contra la base de producción antes del primer deploy (`npm run db:deploy`)
6. El build de **producción** ejecuta `prisma migrate deploy` automáticamente (y falla si faltan las variables). Los builds de **preview** no ejecutan migraciones.

### Despliegue automático a producción

Cada **push a `main`** pasa primero por CI (lint, typecheck, tests, build) y, si todo es verde, despliega automáticamente a producción mediante GitHub Actions (`.github/workflows/deploy-production.yml`, disparado al completar CI con éxito).

> Las ramas distintas de `main` siguen generando **preview deployments** en Vercel. El build de `main` en Vercel está desactivado en `vercel.json` para evitar deploys duplicados; producción la gestiona el workflow.

Para que el workflow de GitHub funcione, configura estos secrets en el repositorio (**Settings → Secrets and variables → Actions**):

| Secret | Dónde obtenerlo |
|--------|-----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel → Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |

**Flujo recomendado:** mergea tu PR a `main` → CI valida el código → si pasa, producción se despliega automáticamente. Las ramas `cursor/*` y PRs siguen generando **preview deployments** sin afectar producción.

## Estructura

```
src/
├── app/              # Rutas (App Router) y API routes
├── components/       # UI reutilizable
│   ├── dashboard/
│   ├── layout/
│   └── ui/
└── lib/
    ├── db/           # Queries Prisma y mappers
    └── prisma.ts     # Cliente singleton
prisma/
├── schema.prisma     # Modelos de datos
└── seed.ts           # Datos iniciales
design/               # Mockups originales de Stitch (referencia)
```

## Próximos pasos

- [x] Conectar base de datos PostgreSQL
- [ ] Autenticación de operadores
- [ ] WebSockets / actualizaciones en tiempo real
- [ ] Integración ERP
- [ ] Notificaciones SMS / push

## Licencia

Privado — MC Designs / Agrocentro Solá
