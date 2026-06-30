# CRM AgroSol — Agrocentro Solá

CRM de logística para **Agrocentro Solá**. Gestión de órdenes, entregas, sucursales y pings en tiempo real.

Repositorio oficial: [github.com/mcdesignspur-svg/CRM-AgroSol-](https://github.com/mcdesignspur-svg/CRM-AgroSol-)

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/` | Panel de logística — métricas, órdenes recientes, pings en vivo |
| `/ordenes/nueva` | Registro de nueva orden con retiro/entrega |
| `/entregas` | Mapa, entregas activas, estado de sucursales |
| `/sucursales` | Vista de red y capacidad por sucursal |

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Producción

```bash
npm run build
npm start
```

### Deploy en Vercel

1. Conecta el repositorio de GitHub en [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Deploy automático en cada push a `main`

## Estructura

```
src/
├── app/              # Rutas (App Router)
├── components/       # UI reutilizable
│   ├── dashboard/
│   ├── layout/
│   └── ui/
└── lib/              # Tipos, constantes, datos mock
design/               # Mockups originales de Stitch (referencia)
```

## Próximos pasos

- [ ] Conectar base de datos (Supabase / PostgreSQL)
- [ ] Autenticación de operadores
- [ ] API de órdenes y entregas en tiempo real
- [ ] Integración ERP
- [ ] Notificaciones SMS / push

## Licencia

Privado — MC Designs / Agrocentro Solá
