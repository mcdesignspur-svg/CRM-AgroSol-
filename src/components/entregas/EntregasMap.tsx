"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { BRANCH_LABELS } from "@/lib/constants";
import {
  getBranchCoordinates,
  getDeliveryCoordinates,
  isDeliveryHighlighted,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  type LatLng,
} from "@/lib/geo";
import type { Branch, BranchId, Delivery } from "@/lib/types";
import "leaflet/dist/leaflet.css";

interface EntregasMapProps {
  branches: Branch[];
  deliveries: Delivery[];
  activeBranchId: BranchId | null;
  ordenId: string | null;
  onLocateError?: (message: string) => void;
}

function createBranchIcon(highlighted: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;
      background:${highlighted ? "#fcd400" : "#ffffff"};
      border:2px solid #000;
      box-shadow:3px 3px 0 #000;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;line-height:1;
    ">🏪</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createDeliveryIcon(highlighted: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${highlighted ? 30 : 24}px;
      height:${highlighted ? 30 : 24}px;
      background:#e31e24;
      border:2px solid #000;
      box-shadow:${highlighted ? "4px 4px 0 #000" : "2px 2px 0 #000"};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:700;
      ${highlighted ? "animation:pulse 1.5s infinite;" : ""}
    ">🚚</div>`,
    iconSize: [highlighted ? 30 : 24, highlighted ? 30 : 24],
    iconAnchor: [highlighted ? 15 : 12, highlighted ? 15 : 12],
    popupAnchor: [0, -16],
  });
}

function MapViewport({
  positions,
  focusPosition,
}: {
  positions: LatLng[];
  focusPosition: LatLng | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusPosition) {
      map.flyTo(focusPosition, 14, { duration: 0.8 });
      return;
    }

    if (positions.length === 0) {
      map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 13);
      return;
    }

    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 14 });
  }, [focusPosition, map, positions]);

  return null;
}

function MapRefBridge({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
}

function MapLayers({
  branches,
  deliveries,
  activeBranchId,
  ordenId,
  mapRef,
}: EntregasMapProps & { mapRef: React.RefObject<L.Map | null> }) {
  const visibleBranches = activeBranchId
    ? branches.filter((branch) => branch.id === activeBranchId)
    : branches;

  const deliveryMarkers = useMemo(
    () =>
      deliveries.map((delivery) => ({
        delivery,
        position: getDeliveryCoordinates(delivery),
        highlighted: isDeliveryHighlighted(delivery, ordenId),
      })),
    [deliveries, ordenId],
  );

  const branchMarkers = useMemo(
    () =>
      visibleBranches.map((branch) => ({
        branch,
        position: getBranchCoordinates(branch.id),
        highlighted: branch.id === activeBranchId,
      })),
    [activeBranchId, visibleBranches],
  );

  const allPositions = useMemo(
    () => [
      ...branchMarkers.map((marker) => marker.position),
      ...deliveryMarkers.map((marker) => marker.position),
    ],
    [branchMarkers, deliveryMarkers],
  );

  const focusPosition = useMemo(() => {
    const highlightedDelivery = deliveryMarkers.find((marker) => marker.highlighted);
    if (highlightedDelivery) {
      return highlightedDelivery.position;
    }

    if (activeBranchId) {
      return getBranchCoordinates(activeBranchId);
    }

    return null;
  }, [activeBranchId, deliveryMarkers]);

  return (
    <>
      <MapRefBridge mapRef={mapRef} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport positions={allPositions} focusPosition={focusPosition} />

      {branchMarkers.map(({ branch, position, highlighted }) => (
        <Marker
          key={`branch-${branch.id}`}
          position={position}
          icon={createBranchIcon(highlighted)}
        >
          <Popup>
            <div className="text-sm space-y-1 min-w-[180px]">
              <p className="font-bold uppercase">{branch.name}</p>
              <p className="text-xs text-gray-600">{branch.address}</p>
              <p className="text-xs font-medium">
                Capacidad: {branch.capacityPercent}%
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {deliveryMarkers.map(({ delivery, position, highlighted }) => (
        <Marker
          key={`delivery-${delivery.id}`}
          position={position}
          icon={createDeliveryIcon(highlighted)}
        >
          <Popup>
            <div className="text-sm space-y-1 min-w-[200px]">
              <p className="font-mono font-bold text-primary">#{delivery.id}</p>
              <p className="font-semibold">{delivery.driverName}</p>
              <p className="text-xs text-gray-600">{delivery.destination}</p>
              <p className="text-xs font-mono">ETA: {delivery.eta}</p>
              {delivery.branchId ? (
                <p className="text-xs font-medium">
                  {BRANCH_LABELS[delivery.branchId]}
                </p>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export function EntregasMap({
  branches,
  deliveries,
  activeBranchId,
  ordenId,
  onLocateError,
}: EntregasMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className="relative h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <MapLayers
          branches={branches}
          deliveries={deliveries}
          activeBranchId={activeBranchId}
          ordenId={ordenId}
          mapRef={mapRef}
        />
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="bg-white p-2 border border-outline hover:bg-surface-container active:scale-95 shadow-sm"
          aria-label="Acercar mapa"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="bg-white p-2 border border-outline hover:bg-surface-container active:scale-95 shadow-sm"
          aria-label="Alejar mapa"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;

            if (!navigator.geolocation) {
              onLocateError?.("Geolocalización no disponible en este navegador");
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                map.flyTo(
                  [position.coords.latitude, position.coords.longitude],
                  14,
                  { duration: 0.8 },
                );
              },
              () => {
                onLocateError?.("No se pudo obtener tu ubicación");
              },
              { enableHighAccuracy: true, timeout: 10_000 },
            );
          }}
          className="bg-white p-2 border border-outline hover:bg-surface-container active:scale-95 shadow-sm"
          aria-label="Centrar en mi ubicación"
        >
          <span className="material-symbols-outlined text-primary-container">
            my_location
          </span>
        </button>
      </div>
    </div>
  );
}
