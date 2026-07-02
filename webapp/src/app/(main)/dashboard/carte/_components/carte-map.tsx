"use client";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useEffect, useRef } from "react";

import { pointsContact, pointsDistribution, projetsDePlantation, statsCommunales } from "./data";
import type { AttributeKey, LayerId } from "./types";
import { ATTRIBUTE_CONFIG, buildChoroplethPaint } from "./types";

const BASEMAP = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const COLORS = { distribution: "#2563eb", projet: "#16a34a", contact: "#9333ea" } as const;

function popupHtml(lines: string[]): string {
  return lines.map((l) => `<p style="margin:2px 0;font-size:12px">${l}</p>`).join("");
}

interface CarteMapProps {
  communesAttribute: AttributeKey | null;
  layerVisibility: Record<LayerId, boolean>;
}

export function CarteMap({ communesAttribute, layerVisibility }: CarteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Register PMTiles protocol
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [-1.5536, 47.2184],
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // ── Communes PMTiles choropleth ─────────────────────────────────────
      map.addSource("communes-kpi", {
        type: "vector",
        url: "pmtiles:///pmtiles/communes_repousse_kpi.pmtiles",
      });

      map.addLayer({
        id: "communes-fill",
        type: "fill",
        source: "communes-kpi",
        "source-layer": "communes",
        layout: { visibility: "none" },
        paint: {
          "fill-color": "#e5e7eb",
          "fill-opacity": 0.6,
        },
      });

      map.addLayer({
        id: "communes-outline",
        type: "line",
        source: "communes-kpi",
        "source-layer": "communes",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#9ca3af",
          "line-width": 0.8,
        },
      });

      map.on("click", "communes-fill", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        const nom = p.commune_nom ?? p.libelle_long ?? "Commune";
        const lines = [
          `🌿 ${Number(p.nb_plants_distribues || 0).toLocaleString("fr-FR")} plants distribués`,
          `👤 ${p.nb_adherents || 0} adhérent(s)`,
          `📍 ${p.nb_points_distribution || 0} point(s) de distribution`,
          `🌱 ${p.nb_projets_plantation || 0} projet(s) de plantation`,
        ];
        new maplibregl.Popup({ closeButton: false, maxWidth: "220px" })
          .setLngLat(e.lngLat)
          .setHTML(`<strong style="font-size:13px">${nom}</strong>` + popupHtml(lines))
          .addTo(map);
      });
      map.on("mouseenter", "communes-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "communes-fill", () => { map.getCanvas().style.cursor = ""; });

      // ── Stats communales — bubble layer ─────────────────────────────────
      map.addSource("stats", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: statsCommunales.map((s) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [s.lng, s.lat] },
            properties: { ...s },
          })),
        },
      });
      map.addLayer({
        id: "stats-circles",
        type: "circle",
        source: "stats",
        paint: {
          "circle-color": "#ea580c",
          "circle-opacity": 0.25,
          "circle-stroke-color": "#ea580c",
          "circle-stroke-width": 1.5,
          "circle-radius": ["interpolate", ["linear"], ["get", "plantsDistribues"], 0, 8, 500, 18, 2000, 32],
        },
      });
      map.on("click", "stats-circles", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: false, maxWidth: "200px" }).setLngLat(e.lngLat)
          .setHTML(`<strong style="font-size:13px">${p.commune} (${p.codePostal})</strong>` +
            popupHtml([
              `🌿 ${Number(p.plantsDistribues).toLocaleString("fr-FR")} plants`,
              `👤 ${p.adherents} adhérent(s)`,
            ]))
          .addTo(map);
      });
      map.on("mouseenter", "stats-circles", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "stats-circles", () => { map.getCanvas().style.cursor = ""; });

      // ── Points de distribution ───────────────────────────────────────────
      map.addSource("distributions", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: pointsDistribution.map((d) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [d.lng, d.lat] },
            properties: { ...d },
          })),
        },
      });
      map.addLayer({ id: "distributions-points", type: "circle", source: "distributions", paint: { "circle-color": COLORS.distribution, "circle-radius": 8, "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.on("click", "distributions-points", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: false, maxWidth: "220px" }).setLngLat(e.lngLat)
          .setHTML(`<strong style="font-size:13px">🔵 ${p.nom}</strong>` +
            popupHtml([`${p.commune} — ${p.statut === "actif" ? "Actif" : "Archivé"}`, `${Number(p.plantsDistribues).toLocaleString("fr-FR")} plants`, `Dernière distrib. : ${new Date(p.derniereDistribution).toLocaleDateString("fr-FR")}`]))
          .addTo(map);
      });
      map.on("mouseenter", "distributions-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "distributions-points", () => { map.getCanvas().style.cursor = ""; });

      // ── Projets de plantation ────────────────────────────────────────────
      const statutLabel: Record<string, string> = { actif: "Actif", en_cours: "En cours", complete: "Terminé", archive: "Archivé" };
      map.addSource("projets", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: projetsDePlantation.map((p) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: { ...p },
          })),
        },
      });
      map.addLayer({ id: "projets-points", type: "circle", source: "projets", paint: { "circle-color": COLORS.projet, "circle-radius": 7, "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.on("click", "projets-points", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: false, maxWidth: "220px" }).setLngLat(e.lngLat)
          .setHTML(`<strong style="font-size:13px">🟢 ${p.nom}</strong>` +
            popupHtml([`${p.commune} — ${statutLabel[p.statut] ?? p.statut}`, `${p.plantsAssocies} plants · ${Number(p.surface).toLocaleString("fr-FR")} m²`, `Adoptant : ${p.adoptant}`]))
          .addTo(map);
      });
      map.on("mouseenter", "projets-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "projets-points", () => { map.getCanvas().style.cursor = ""; });

      // ── Contacts régionaux ───────────────────────────────────────────────
      const typeLabel: Record<string, string> = { coordination: "Coordination", benevole_referent: "Référent bénévole", partenaire: "Partenaire" };
      map.addSource("contacts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: pointsContact.map((c) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [c.lng, c.lat] },
            properties: { ...c },
          })),
        },
      });
      map.addLayer({ id: "contacts-points", type: "circle", source: "contacts", paint: { "circle-color": COLORS.contact, "circle-radius": 9, "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.on("click", "contacts-points", (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: false, maxWidth: "220px" }).setLngLat(e.lngLat)
          .setHTML(`<strong style="font-size:13px">🟣 ${p.nom}</strong>` +
            popupHtml([`${p.commune} — ${typeLabel[p.type] ?? p.type}`, p.description]))
          .addTo(map);
      });
      map.on("mouseenter", "contacts-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "contacts-points", () => { map.getCanvas().style.cursor = ""; });

      loadedRef.current = true;
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  // React to communesAttribute changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (!map.getLayer("communes-fill")) return;

    if (communesAttribute === null) {
      map.setLayoutProperty("communes-fill", "visibility", "none");
      map.setLayoutProperty("communes-outline", "visibility", "none");
    } else {
      map.setLayoutProperty("communes-fill", "visibility", "visible");
      map.setLayoutProperty("communes-outline", "visibility", "visible");
      const cfg = ATTRIBUTE_CONFIG[communesAttribute];
      map.setPaintProperty("communes-fill", "fill-color", buildChoroplethPaint(communesAttribute));
      map.setPaintProperty("communes-fill", "fill-opacity", cfg.opacity);
    }
  }, [communesAttribute]);

  // React to point layer visibility changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const layerMap: Record<LayerId, string[]> = {
      distributions: ["distributions-points"],
      projets: ["projets-points"],
      contacts: ["contacts-points"],
      stats: ["stats-circles"],
    };
    for (const [id, layers] of Object.entries(layerMap)) {
      const vis = layerVisibility[id as LayerId] ? "visible" : "none";
      for (const layer of layers) {
        if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", vis);
      }
    }
  }, [layerVisibility]);

  return <div ref={containerRef} className="h-full w-full rounded-xl" />;
}
