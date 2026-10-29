"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface JourneyMapPoint {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  role: "origin" | "checkpoint" | "destination" | "incident";
  labeled?: boolean;
}

export interface JourneyMapLine {
  id: string;
  label: string;
  style: "solid" | "dashed";
  tone: "green" | "red";
  pointIds: string[];
}

const TILE = 256;

function project(latitude: number, longitude: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const x = ((longitude + 180) / 360) * scale;
  const sine = Math.sin((latitude * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function JourneyMap({
  points,
  lines,
  children,
  className = "h-[440px]",
}: {
  points: JourneyMapPoint[];
  lines: JourneyMapLine[];
  children?: ReactNode;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 960, height: 440 });
  const [tilesReady, setTilesReady] = useState(true);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const measure = () =>
      setSize({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scene = useMemo(() => {
    const width = Math.max(size.width, 320);
    const height = Math.max(size.height, 240);
    let chosen = 6;
    let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    for (let zoom = 9; zoom >= 5; zoom -= 1) {
      const projected = points.map((point) =>
        project(point.latitude, point.longitude, zoom)
      );
      const minX = Math.min(...projected.map((point) => point.x));
      const maxX = Math.max(...projected.map((point) => point.x));
      const minY = Math.min(...projected.map((point) => point.y));
      const maxY = Math.max(...projected.map((point) => point.y));
      if (maxX - minX < width - 96 && maxY - minY < height - 96) {
        chosen = zoom;
        bounds = { minX, maxX, minY, maxY };
        break;
      }
      chosen = zoom;
      bounds = { minX, maxX, minY, maxY };
    }
    const originX = (bounds.minX + bounds.maxX) / 2 - width / 2;
    const originY = (bounds.minY + bounds.maxY) / 2 - height / 2;
    const locate = (id: string) => {
      const point = points.find((item) => item.id === id);
      if (!point) return null;
      const world = project(point.latitude, point.longitude, chosen);
      return { x: world.x - originX, y: world.y - originY, point };
    };
    const x0 = Math.floor(originX / TILE);
    const x1 = Math.floor((originX + width) / TILE);
    const y0 = Math.floor(originY / TILE);
    const y1 = Math.floor((originY + height) / TILE);
    const tiles: { key: string; left: number; top: number; href: string }[] =
      [];
    if ((x1 - x0 + 1) * (y1 - y0 + 1) <= 24) {
      for (let x = x0; x <= x1; x += 1) {
        for (let y = y0; y <= y1; y += 1) {
          if (x < 0 || y < 0) continue;
          tiles.push({
            key: `${chosen}-${x}-${y}`,
            left: x * TILE - originX,
            top: y * TILE - originY,
            href: `https://tile.openstreetmap.org/${chosen}/${x}/${y}.png`,
          });
        }
      }
    }
    return { width, height, tiles, locate };
  }, [points, size.height, size.width]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-khet-line bg-[#d7e7d8] ${className}`}
    >
      <div ref={frame} className="absolute inset-0">
        {tilesReady
          ? scene.tiles.map((tile) => (
              // OSM raster tiles. Straight checkpoint links are drawn above them.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={tile.key}
                src={tile.href}
                alt=""
                width={256}
                height={256}
                className="absolute max-w-none"
                style={{ left: tile.left, top: tile.top }}
                onError={() => setTilesReady(false)}
              />
            ))
          : null}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${scene.width} ${scene.height}`}
          role="img"
          aria-label="Simulated shipment route"
        >
          {lines.map((line) => {
            const commands = line.pointIds
              .map((id) => scene.locate(id))
              .filter((point) => point !== null)
              .map((point) => `${point.x},${point.y}`)
              .join(" ");
            return (
              <polyline
                key={line.id}
                points={commands}
                fill="none"
                stroke={line.tone === "red" ? "#d15a4a" : "#1b7a46"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={line.style === "dashed" ? "8 7" : undefined}
              />
            );
          })}
          {points.map((point) => {
            const placed = scene.locate(point.id);
            if (!placed) return null;
            const incident = point.role === "incident";
            return (
              <g key={point.id}>
                <circle
                  cx={placed.x}
                  cy={placed.y}
                  r={incident ? 9 : 6}
                  fill={incident ? "#d15a4a" : "#1b7a46"}
                  stroke="white"
                  strokeWidth="3"
                />
                {incident ? (
                  <text
                    x={placed.x}
                    y={placed.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="white"
                  >
                    !
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {points.map((point) => {
          if (point.labeled === false) return null;
          const placed = scene.locate(point.id);
          if (!placed) return null;
          return (
            <span
              key={`${point.id}-label`}
              className="absolute -translate-x-1/2 -translate-y-[140%] whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-semibold text-khet-ink shadow-sm"
              style={{ left: placed.x, top: placed.y }}
            >
              {point.label}
            </span>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0">{children}</div>
      <p className="absolute bottom-2 right-3 rounded bg-white/90 px-2 py-1 text-[10px] text-khet-muted">
        {tilesReady
          ? "Simulated route links · © OpenStreetMap"
          : "Map tiles unavailable · simulated checkpoint links"}
      </p>
    </div>
  );
}
