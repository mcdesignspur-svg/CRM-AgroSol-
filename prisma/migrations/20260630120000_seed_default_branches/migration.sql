-- Ensure default branches exist for order foreign keys.
INSERT INTO "branches" (
  "id",
  "name",
  "address",
  "capacity_percent",
  "current_volume",
  "status",
  "created_at",
  "updated_at"
)
VALUES
  ('gurabo', 'Gurabo (Central)', 'Av. Agrícola 450', 0, 0, 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('san-lorenzo', 'San Lorenzo', 'Km 12 Carretera Federal', 0, 0, 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('navarro', 'Ferretería Navarro', 'Zona Industrial Lote 9', 0, 0, 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
