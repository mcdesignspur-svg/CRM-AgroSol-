-- Persist geocoded destination coordinates for active map markers.
ALTER TABLE "deliveries" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "deliveries" ADD COLUMN "lng" DOUBLE PRECISION;
