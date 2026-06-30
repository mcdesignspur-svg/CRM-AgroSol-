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

### 4. Loyverse (opcional)

Si ya tienes el **Personal Access Token** de Loyverse:

1. En Loyverse Back Office → **Access Tokens** → copia el token
2. Añádelo a `.env` (y a las variables de entorno en Vercel):

```
LOYVERSE_ACCESS_TOKEN="tu-token-aqui"
```

3. Reinicia el servidor (`npm run dev`)
4. En **Productos** (Gurabo), usa **Importar catálogo completo** una vez (~12k productos, tarda 1–2 min)
5. Al crear órdenes, busca productos por **nombre o SKU** — no se cargan los 12k en pantalla

Por ahora solo **Gurabo (Central)** tiene Loyverse. Cada sucursal tendrá su propio token más adelante.

La app verifica la conexión contra la API de Loyverse y guarda el catálogo en cache local por sucursal.

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
3. Añade la variable de entorno `DATABASE_URL` (p. ej. Neon, Supabase o Railway)
4. En **Settings → Environments → Production**, confirma:
   - **Production Branch**: `main`
   - **Auto-assign Custom Production Domains**: activado (cada push a `main` va directo a producción)
5. Ejecuta migraciones contra la base de producción antes del primer deploy (`npm run db:deploy`)
6. El build ejecuta migraciones automáticamente **si** `DATABASE_URL` está disponible en el entorno de build

### Despliegue automático a producción

Cada **push a `main`** despliega automáticamente a producción mediante GitHub Actions (`.github/workflows/deploy-production.yml`).

> Las ramas distintas de `main` siguen generando **preview deployments** en Vercel. El build de `main` en Vercel está desactivado en `vercel.json` para evitar deploys duplicados; producción la gestiona el workflow.

Para que el workflow de GitHub funcione, configura estos secrets en el repositorio (**Settings → Secrets and variables → Actions**):

| Secret | Dónde obtenerlo |
|--------|-----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel → Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |

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
- [ ] Integración ERP (Loyverse Gurabo: cache + búsqueda; otras sucursales y órdenes pendiente)
- [ ] Notificaciones SMS / push

## Licencia

Privado — MC Designs / Agrocentro Solá
