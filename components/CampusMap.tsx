"use client";

import { useEffect, useMemo } from "react";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { CampusPlace } from "@/lib/types";

type CampusKey = CampusPlace["campus"];

interface CampusMapProps {
  campus: CampusKey;
  places: CampusPlace[];
  selectedPlaceId: string | null;
  onSelectPlace: (place: CampusPlace) => void;
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

function MapSelectionController({ selected }: { selected: CampusPlace | null }) {
  const map = useMap();

  useEffect(() => {
    if (selected) map.panTo(getPlacePosition(selected));
  }, [map, selected]);

  return null;
}

export default function CampusMap({ campus, places, selectedPlaceId, onSelectPlace }: CampusMapProps) {
  const config = campusConfig[campus];
  const campusPlaces = places.filter((place) => place.campus === campus);
  const selected = campusPlaces.find((place) => place.id === selectedPlaceId) ?? null;
  const markerIcons = useMemo(() => ({
    default: L.divIcon({ className: "campus-leaflet-marker", html: "<span></span>", iconSize: [24, 24], iconAnchor: [12, 12] }),
    selected: L.divIcon({ className: "campus-leaflet-marker selected", html: "<span></span>", iconSize: [30, 30], iconAnchor: [15, 15] })
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
      <MapSelectionController selected={selected} />
    </MapContainer>
  );
}
