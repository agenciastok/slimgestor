"use client";

import { useEffect, useMemo, useState } from "react";

type Feature = {
  properties: { name: string; sigla: string };
  geometry: { coordinates: number[][][][] };
};

function project(lng: number, lat: number) {
  return [((lng + 74) / 42) * 420, ((6 - lat) / 40) * 420];
}

function pathOf(feature: Feature) {
  return feature.geometry.coordinates
    .map((polygon) =>
      polygon
        .map((ring) =>
          ring
            .map((point, index) => {
              const [x, y] = project(point[0], point[1]);
              return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ") + " Z",
        )
        .join(" "),
    )
    .join(" ");
}

export function BrazilMap({ counts }: { counts: Record<string, number> }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [hover, setHover] = useState<string>("");

  useEffect(() => {
    fetch("/brazil-states.json")
      .then((response) => response.json())
      .then((data: { features: Feature[] }) => setFeatures(data.features ?? []))
      .catch(() => setFeatures([]));
  }, []);

  const max = Math.max(1, ...Object.values(counts));
  const paths = useMemo(() => features.map((feature) => ({ feature, d: pathOf(feature) })), [features]);

  return (
    <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
      <div>
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Top estados</div>
        <div className="space-y-2">
          {Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([uf, total]) => (
              <div key={uf} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{uf}</span>
                <span className="font-semibold text-white">{total}</span>
              </div>
            ))}
          {Object.keys(counts).length === 0 ? <div className="text-sm text-slate-500">Sem clientes com estado.</div> : null}
        </div>
      </div>
      <div>
        <svg viewBox="0 0 420 420" className="h-72 w-full">
          {paths.map(({ feature, d }) => {
            const total = counts[feature.properties.sigla] ?? 0;
            const tone = total === 0 ? "#1e293b" : `rgba(46, 230, 199, ${0.25 + (total / max) * 0.75})`;
            return (
              <path
                key={feature.properties.sigla}
                d={d}
                fill={tone}
                stroke="#0b1224"
                strokeWidth="1"
                onMouseEnter={() => setHover(`${feature.properties.name}: ${total}`)}
                onMouseLeave={() => setHover("")}
              />
            );
          })}
        </svg>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{hover || "Passe o mouse no estado"}</span>
          <span>Menos → Mais</span>
        </div>
      </div>
    </div>
  );
}
