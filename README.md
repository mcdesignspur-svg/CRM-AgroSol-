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
| `/ordenes/nueva` | Registro de nueva orden con retiro/entrega |
| `/entregas` | Mapa, entregas activas, estado de sucursales |
| `/sucursales` | Vista de red y capacidad por sucursal |

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

La URL por defecto es:

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
| `npm run db:seed` | Siembra sucursales iniciales |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:push` | Sincroniza schema sin migración (prototipado) |

## Producción

```bash
npm run build
npm start
```

Requiere `DATABASE_URL` apuntando a una instancia PostgreSQL accesible.

### Deploy en Vercel

1. Conecta el repositorio de GitHub en [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Añade las variables de entorno en Vercel:
   - `DATABASE_URL` — URL **pooled** de Neon (con `-pooler` en el host) para runtime
   - `DIRECT_DATABASE_URL` — URL **directa** de Neon (sin `-pooler`) — solo si necesitas migrar desde Vercel manualmente
4. En **Settings → Environments → Production**, confirma:
   - **Production Branch**: `main`
   - **Auto-assign Custom Production Domains**: activado (cada push a `main` va directo a producción)
5. Ejecuta migraciones con `npm run db:deploy` usando `DIRECT_DATABASE_URL` (no la URL pooled)
6. El build de Vercel **no** ejecuta migraciones (evita error Prisma P1002 con Neon pooled)

### Despliegue automático a producción

Cada **push a `main`** despliega automáticamente a producción mediante GitHub Actions (`.github/workflows/deploy-production.yml`).

> Las ramas distintas de `main` siguen generando **preview deployments** en Vercel. El build de `main` en Vercel está desactivado en `vercel.json` para evitar deploys duplicados; producción la gestiona el workflow.

Para que el workflow de GitHub funcione, configura estos secrets en el repositorio (**Settings → Secrets and variables → Actions**):

| Secret | Dónde obtenerlo |
|--------|-----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel → Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |
| `DIRECT_DATABASE_URL` | Neon → Connection Details → **Direct** connection (sin `-pooler`) |

**Flujo recomendado:** mergea tu PR a `main` → el push dispara producción automáticamente. Las ramas `cursor/*` y PRs siguen generando **preview deployments** sin afectar producción.

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
