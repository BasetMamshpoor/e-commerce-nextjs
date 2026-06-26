"use client";

import * as React from "react";
import dynamic from "next/dynamic";

// Leaflet accesses `window` at module-eval time, so we must disable SSR
// for the map picker entirely.
const AddressMapPickerClient = dynamic(
  () => import("./address-map-picker-client").then((m) => m.AddressMapPickerClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-border bg-muted">
        <div className="text-sm text-muted-foreground">در حال بارگذاری نقشه...</div>
      </div>
    ),
  },
);

interface AddressMapPickerProps {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export function AddressMapPicker(props: AddressMapPickerProps) {
  return <AddressMapPickerClient {...props} />;
}
