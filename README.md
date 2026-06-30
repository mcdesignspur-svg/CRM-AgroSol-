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

### Integración Loyverse

1. Obtén un token en [Loyverse Back Office → Integrations → Tokens](https://r.loyverse.com/dashboard/#/integrations/tokens)
2. Configura en `.env`:

```
LOYVERSE_ACCESS_TOKEN="tu-token"
LOYVERSE_RECEIPT_SOURCE="AgroSol CRM"
LOYVERSE_WEBHOOK_SECRET="opcional"
```

3. Sincroniza catálogo y tiendas desde `/productos` → **Sync Loyverse**, o vía API:

```bash
curl -X POST http://localhost:3000/api/integrations/loyverse/sync \
  -H "Content-Type: application/json" \
  -d '{"scope":"all"}'
```

4. Registra el webhook en Loyverse apuntando a:

```
https://tu-dominio/api/integrations/loyverse/webhook
```

Eventos soportados: `items.update`, `customers.update`, `receipts.update`, `inventory_levels.update`.

Al completar una orden en el CRM se crea un receipt en Loyverse. Las ventas del POS se importan como órdenes logísticas.

### Deploy en Vercel

1. Conecta el repositorio de GitHub en [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Añade la variable de entorno `DATABASE_URL` (p. ej. Neon, Supabase o Railway)
4. Ejecuta migraciones contra la base de producción antes del primer deploy
5. Deploy automático en cada push a `main`

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
- [x] Integración Loyverse (items, stores, receipts, webhooks)
- [ ] Notificaciones SMS / push

## Licencia

Privado — MC Designs / Agrocentro Solá
