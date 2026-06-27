"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Custom divIcon for the marker (avoids Leaflet's broken default icon URLs).
const customIcon = L.divIcon({
  html: `<div style="background: hsl(var(--primary)); width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: "custom-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

interface AddressMapPickerClientProps {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export function AddressMapPickerClient({
  value,
  onChange,
  className,
}: AddressMapPickerClientProps) {
  const [position, setPosition] = React.useState<{ lat: number; lng: number }>(value);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setPosition(value);
  }, [value.lat, value.lng]);

  const updatePosition = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onChange({ lat, lng });
  };

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&limit=1&countrycodes=ir`,
        { headers: { "Accept-Language": "fa" } },
      );
      const data = await res.json();
      if (data && data[0]) {
        updatePosition(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch {
      // Network error — ignore.
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="جست‌وجوی آدرس (مثلا: تهران، میدان آزادی)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 text-sm"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          جست‌وجو
        </Button>
      </form>

      <div
        className="relative overflow-hidden rounded-lg border border-border"
        style={{ height: 320 }}
      >
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={updatePosition} />
          <MapRecenter lat={position.lat} lng={position.lng} />
          <Marker
            position={[position.lat, position.lng]}
            icon={customIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const ll = m.getLatLng();
                updatePosition(ll.lat, ll.lng);
              },
            }}
          />
        </MapContainer>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 text-primary" />
        مختصات انتخاب‌شده:{" "}
        <span className="nums-fa font-medium" dir="ltr">
          {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </span>
      </p>
    </div>
  );
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}
