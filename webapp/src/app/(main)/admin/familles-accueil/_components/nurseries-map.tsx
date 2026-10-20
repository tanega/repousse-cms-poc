"use client";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

import { formatPhone } from "@/lib/phone";

import { ownerName } from "./data";
import type { NurseryRow } from "./nurseries-table";

const BASEMAP = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const COLOR = "#ea580c";
const SELECTED_COLOR = "#7c2d12";

function located(rows: NurseryRow[]) {
  return rows.filter((r) => r.nursery.lat != null && r.nursery.lng != null);
}

function features(rows: NurseryRow[], focusedId: string | null) {
  return {
    type: "FeatureCollection" as const,
    features: located(rows).map((r) => ({
      type: "Feature" as const,
      id: r.nursery.id,
      geometry: { type: "Point" as const, coordinates: [r.nursery.lng as number, r.nursery.lat as number] },
      properties: { id: r.nursery.id, focused: r.nursery.id === focusedId },
    })),
  };
}

// Built with DOM nodes + textContent, never setHTML: nursery names, notes and
// addresses are member input.
function popupContent(row: NurseryRow): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText = "font-size:12px;line-height:1.4;color:#111";
  const line = (text: string, style = "") => {
    const p = document.createElement("p");
    p.style.cssText = `margin:2px 0;${style}`;
    p.textContent = text;
    root.append(p);
    return p;
  };
  const link = (href: string, text: string) => {
    const p = document.createElement("p");
    p.style.margin = "2px 0";
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.style.cssText = "color:#c2410c;text-decoration:underline";
    p.append(a);
    root.append(p);
  };

  line(row.nursery.name, "font-weight:600;font-size:13px");
  if (row.nursery.address) line(row.nursery.address, "color:#555");
  line(`${row.quantity.toLocaleString("fr-FR")} plants`, "margin-top:6px;font-weight:500");
  for (const l of row.lines.slice(0, 5)) line(`· ${l.name} : ${l.quantity.toLocaleString("fr-FR")}`);
  if (row.lines.length > 5) line(`… et ${row.lines.length - 5} autre(s)`, "color:#555");

  const owner = row.nursery.owner;
  line(ownerName(owner), "margin-top:6px;font-weight:500");
  if (owner?.email) link(`mailto:${owner.email}`, owner.email);
  if (owner?.phone) link(`tel:${owner.phone}`, formatPhone(owner.phone));
  if (owner) link(`/membres/${owner.id}`, "Voir la fiche membre");
  return root;
}

export function NurseriesMap({
  rows,
  focusedId,
  onFocus,
}: {
  rows: NurseryRow[];
  focusedId: string | null;
  onFocus: (nurseryId: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const loadedRef = useRef(false);
  // Latest props for the map's event handlers, registered once at load.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [-1.5536, 47.2184],
      zoom: 9,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      map.addSource("nurseries", { type: "geojson", data: features(rowsRef.current, null) });
      map.addLayer({
        id: "nurseries-points",
        type: "circle",
        source: "nurseries",
        paint: {
          "circle-color": ["case", ["get", "focused"], SELECTED_COLOR, COLOR],
          "circle-radius": ["case", ["get", "focused"], 9, 7],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
      map.on("click", "nurseries-points", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onFocusRef.current(id);
      });
      map.on("mouseenter", "nurseries-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "nurseries-points", () => {
        map.getCanvas().style.cursor = "";
      });
      loadedRef.current = true;
      fitTo(map, rowsRef.current);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Filters changed: redraw and frame what's left.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    (map.getSource("nurseries") as maplibregl.GeoJSONSource | undefined)?.setData(features(rows, focusedId));
  }, [rows, focusedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    fitTo(map, rows);
  }, [rows]);

  // A nursery picked from the list or the map: center it and open its card.
  useEffect(() => {
    // Detach before removing: `close` fires synchronously and would otherwise
    // clear the focus we're switching to.
    const previous = popupRef.current;
    popupRef.current = null;
    previous?.remove();
    const map = mapRef.current;
    const row = focusedId ? rows.find((r) => r.nursery.id === focusedId) : undefined;
    if (!map || !row || row.nursery.lat == null || row.nursery.lng == null) return;
    const lngLat: [number, number] = [row.nursery.lng, row.nursery.lat];
    map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), 12) });
    const popup = new maplibregl.Popup({ maxWidth: "260px" }).setLngLat(lngLat).setDOMContent(popupContent(row));
    popup.on("close", () => {
      if (popupRef.current === popup) onFocusRef.current(null);
    });
    popup.addTo(map);
    popupRef.current = popup;
  }, [focusedId, rows]);

  return <div ref={containerRef} data-testid="nurseries-map" className="h-full w-full rounded-lg" />;
}

function fitTo(map: maplibregl.Map, rows: NurseryRow[]) {
  const points = located(rows);
  if (!points.length) return;
  const bounds = new maplibregl.LngLatBounds();
  for (const r of points) bounds.extend([r.nursery.lng as number, r.nursery.lat as number]);
  map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
}
