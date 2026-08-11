"use client";

import { useEffect, useMemo } from "react";
import L, { type LatLngBoundsExpression, type LatLngExpression, type LatLngTuple } from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { CampusPlace, CampusShortcut, CampusShortcutEndpoint } from "@/lib/types";

type CampusKey = CampusPlace["campus"];

interface CampusMapProps {
  campus: CampusKey;
  places: CampusPlace[];
  selectedPlaceId: string | null;
  onSelectPlace: (place: CampusPlace) => void;
  shortcuts?: CampusShortcut[];
  selectedShortcutId?: string | null;
}

const campusConfig: Record<CampusKey, { center: LatLngExpression; bounds: LatLngBoundsExpression }> = {
  donam: {
    center: [37.591341, 127.02098],
    bounds: [[37.5855, 127.014], [37.5972, 127.028]]
  },
  unjeong: {
    center: [37.632123, 127.027417],
    bounds: [[37.6263, 127.0204], [37.6379, 127.0344]]
  }
};

function getPlacePosition(place: CampusPlace): LatLngExpression {
  return [place.latitude, place.longitude];
}

function getEndpointKey(endpoint: CampusShortcutEndpoint) {
  return endpoint.placeId ?? `${endpoint.label}-${endpoint.latitude}-${endpoint.longitude}`;
}

function getEndpointPosition(endpoint: CampusShortcutEndpoint, places: CampusPlace[]): LatLngTuple | null {
  const place = endpoint.placeId ? places.find((item) => item.id === endpoint.placeId) : null;
  if (place) return [place.latitude, place.longitude];
  if (typeof endpoint.latitude === "number" && typeof endpoint.longitude === "number") {
    return [endpoint.latitude, endpoint.longitude];
  }
  return null;
}

function getShortcutPositions(shortcut: CampusShortcut, places: CampusPlace[]): [LatLngTuple, LatLngTuple] | null {
  const first = getEndpointPosition(shortcut.endpoints[0], places);
  const second = getEndpointPosition(shortcut.endpoints[1], places);
  return first && second ? [first, second] : null;
}

function getPositionPairCenter(positions: [LatLngTuple, LatLngTuple]): LatLngExpression {
  const first = positions[0];
  const second = positions[1];
  return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
}

function MapSelectionController({ selected, selectedShortcut, places }: { selected: CampusPlace | null; selectedShortcut: CampusShortcut | null; places: CampusPlace[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedShortcut) {
      const positions = getShortcutPositions(selectedShortcut, places);
      if (positions) map.fitBounds(positions, { maxZoom: 18, padding: [56, 56] });
      return;
    }
    if (selected) map.panTo(getPlacePosition(selected));
  }, [map, places, selected, selectedShortcut]);

  return null;
}

export default function CampusMap({ campus, places, selectedPlaceId, onSelectPlace, shortcuts = [], selectedShortcutId = null }: CampusMapProps) {
  const config = campusConfig[campus];
  const campusPlaces = places.filter((place) => place.campus === campus);
  const selected = campusPlaces.find((place) => place.id === selectedPlaceId) ?? null;
  const campusShortcuts = shortcuts.filter((shortcut) => shortcut.campus === campus);
  const selectedShortcut = campusShortcuts.find((shortcut) => shortcut.id === selectedShortcutId) ?? null;
  const activeEndpointKeys = new Set(selectedShortcut?.endpoints.map(getEndpointKey) ?? []);
  const shortcutEndpointMap = new Map<string, { endpoint: CampusShortcutEndpoint; position: LatLngTuple; isActive: boolean }>();

  campusShortcuts.forEach((shortcut) => {
    shortcut.endpoints.forEach((endpoint) => {
      const key = getEndpointKey(endpoint);
      const position = getEndpointPosition(endpoint, campusPlaces);
      if (!position) return;
      shortcutEndpointMap.set(key, {
        endpoint,
        position,
        isActive: activeEndpointKeys.has(key) || shortcutEndpointMap.get(key)?.isActive === true
      });
    });
  });

  const shortcutEndpoints = Array.from(shortcutEndpointMap.values());
  const markerIcons = useMemo(() => ({
    default: L.divIcon({ className: "campus-leaflet-marker", html: "<span></span>", iconSize: [24, 24], iconAnchor: [12, 12] }),
    selected: L.divIcon({ className: "campus-leaflet-marker selected", html: "<span></span>", iconSize: [30, 30], iconAnchor: [15, 15] }),
    shortcut: L.divIcon({ className: "campus-shortcut-symbol", html: "<span>↔</span>", iconSize: [26, 18], iconAnchor: [13, 9] })
  }), []);

  return (
    <MapContainer
      key={campus}
      center={config.center}
      zoom={17}
      minZoom={15}
      maxZoom={19}
      maxBounds={config.bounds}
      maxBoundsViscosity={1}
      scrollWheelZoom
      className="leaflet-campus-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {campusShortcuts.map((shortcut) => {
        const positions = getShortcutPositions(shortcut, campusPlaces);
        if (!positions) return null;
        const isActive = shortcut.id === selectedShortcutId;
        return (
          <Polyline
            key={shortcut.id}
            positions={positions}
            pathOptions={{
              color: isActive ? "#7c5cc4" : "#9b86cc",
              dashArray: isActive ? undefined : "6 8",
              lineCap: "round",
              opacity: isActive ? 0.86 : 0.46,
              weight: isActive ? 4 : 2.5
            }}
          >
            <Tooltip direction="top" sticky>{shortcut.endpoints.map((endpoint) => endpoint.label).join(" ↔ ")}</Tooltip>
          </Polyline>
        );
      })}
      {campusShortcuts.map((shortcut) => {
        const positions = getShortcutPositions(shortcut, campusPlaces);
        if (!positions) return null;
        return (
          <Marker
            key={`${shortcut.id}-symbol`}
            position={getPositionPairCenter(positions)}
            icon={markerIcons.shortcut}
            interactive={false}
            opacity={shortcut.id === selectedShortcutId ? 0.96 : 0.62}
          />
        );
      })}
      {shortcutEndpoints.map(({ endpoint, position, isActive }) => (
        <CircleMarker
          key={getEndpointKey(endpoint)}
          center={position}
          radius={isActive ? 5 : 3.5}
          pathOptions={{
            color: isActive ? "#7c5cc4" : "#a99ad0",
            fillColor: "#fff",
            fillOpacity: 0.92,
            opacity: isActive ? 0.9 : 0.55,
            weight: isActive ? 2 : 1.5
          }}
        >
          <Tooltip direction="top" offset={[0, -7]} permanent={isActive}>{endpoint.label}</Tooltip>
        </CircleMarker>
      ))}
      {campusPlaces.map((place) => (
        <Marker
          key={place.id}
          position={getPlacePosition(place)}
          icon={place.id === selectedPlaceId ? markerIcons.selected : markerIcons.default}
          eventHandlers={{ click: () => onSelectPlace(place) }}
        >
          <Tooltip direction="top" offset={[0, -10]}>{place.name}</Tooltip>
        </Marker>
      ))}
      <MapSelectionController selected={selected} selectedShortcut={selectedShortcut} places={campusPlaces} />
    </MapContainer>
  );
}
