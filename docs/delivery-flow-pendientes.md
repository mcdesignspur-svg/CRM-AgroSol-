# Delivery flow — pendientes del sprint

Implementado en este sprint:

- Órdenes de entrega inician en `pendiente` (preparación en almacén).
- Acción staff **Marcar despachada** (`pendiente` → `en-transito`): crea registro `Delivery`, asigna conductor del pool y marca `dispatchedAt`.
- Progreso visual (`DeliveryFlowProgress`) en dashboard, detalle de orden y página pública.
- Enlace de seguimiento `/entrega/{token}` con API pública y actualizaciones en tiempo real (WebSocket + polling).
- Panel en detalle de orden con enlace copiable para el cliente.
- SLA: preparación 2 h (`pendiente`), tránsito 4 h desde `dispatchedAt`.

---

## Pendiente para próximos sprints

### Conductor

- [ ] Autenticación en `/conductor` (hoy la ruta es abierta).
- [ ] Acción **Recogí el pedido** como paso intermedio antes de confirmar entrega.
- [ ] Asignación manual de conductor desde `/entregas` (hoy: pool determinístico de un solo conjunto de conductores).
- [ ] Añadir `/conductor` al menú principal de navegación.

### Notificaciones al cliente

- [ ] Envío real de SMS al despachar cuando `smsNotify` está activo (integración Twilio u otro proveedor).
- [ ] Notificación proactiva con el enlace `/entrega/{token}` (hoy solo copiable desde el CRM).

### Mapa y geolocalización

- [x] Geocodificar direcciones reales al despachar (Nominatim) y persistir `lat`/`lng` en `Delivery`; fallback sintético si falla.
- [x] Refresco en tiempo real en `/entregas` (canal WebSocket `entregas` + polling de respaldo `/api/entregas/live`).
- [x] Sincronía lista ↔ mapa (selección bidireccional con `flyTo` y highlight).
- [ ] GPS en vivo del conductor / polilíneas de ruta.
- [ ] Clustering y capas por conductor.

### Otros

- [ ] Tests de integración E2E del flujo completo delivery.
- [ ] Migrar órdenes legacy creadas antes de este cambio (si existen en producción con `en-transito` sin `dispatchedAt`).
