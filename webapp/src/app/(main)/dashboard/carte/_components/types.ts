export type AttributeKey =
  | "nb_plants_distribues"
  | "nb_adherents"
  | "nb_points_distribution"
  | "nb_projets_plantation";

export type LayerId = "distributions" | "projets" | "contacts" | "stats";

interface AttributeCfg {
  label: string;
  unit: string;
  opacity: number;
  // [threshold, color] pairs — first color is the "0 / no data" color
  steps: [number, string][];
}

// Sequential color ramps — zero always maps to a very light neutral
export const ATTRIBUTE_CONFIG: Record<AttributeKey, AttributeCfg> = {
  nb_plants_distribues: {
    label: "Plants distribués",
    unit: "plants",
    opacity: 0.72,
    steps: [
      [0, "#f7fbff"],
      [1, "#deebf7"],
      [50, "#9ecae1"],
      [200, "#4292c6"],
      [700, "#2171b5"],
      [1500, "#084594"],
    ],
  },
  nb_adherents: {
    label: "Adhérents",
    unit: "membres",
    opacity: 0.72,
    steps: [
      [0, "#f7fcf5"],
      [1, "#e5f5e0"],
      [10, "#a1d99b"],
      [25, "#41ab5d"],
      [40, "#238b45"],
      [100, "#005a32"],
    ],
  },
  nb_points_distribution: {
    label: "Points de distribution",
    unit: "points",
    opacity: 0.75,
    steps: [
      [0, "#f7fbff"],
      [1, "#6baed6"],
      [2, "#08519c"],
    ],
  },
  nb_projets_plantation: {
    label: "Projets de plantation",
    unit: "projets",
    opacity: 0.75,
    steps: [
      [0, "#fff5eb"],
      [1, "#fd8d3c"],
      [2, "#7f2704"],
    ],
  },
};

/** Build a MapLibre step paint expression for a given attribute. */
export function buildChoroplethPaint(attr: AttributeKey): unknown[] {
  const { steps } = ATTRIBUTE_CONFIG[attr];
  // ["step", ["get", attr], defaultColor, threshold1, color1, ...]
  const expr: unknown[] = ["step", ["get", attr], steps[0][1]];
  for (const [threshold, color] of steps.slice(1)) {
    expr.push(threshold, color);
  }
  return expr;
}
