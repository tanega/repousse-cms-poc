"use client";

import { useEffect, useRef } from "react";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BASEMAP = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Single-marker preview map for a project's location (lightweight sibling of the full dashboard/carte/_components/carte-map.tsx). */
export function CarteMini({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [lng, lat],
      zoom: 13,
      interactive: true,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    new maplibregl.Marker({ color: "#16a34a" })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ closeButton: false }).setText(label))
      .addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, label]);

  return <div ref={containerRef} className="h-48 w-full rounded-md border" />;
}
