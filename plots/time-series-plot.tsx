"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type LegendPayload,
} from "recharts";
import { TimeSeriesPlotProps } from "@/types/chart";
import { useCsvData } from "@/components/csv-reader";
import { toMDY, mdySortKey, coerceNumber } from "@/lib/date";

const DEFAULT_COLORS = [
  "#b45309", // amber-700
  "#0f766e", // teal-700
  "#7c3aed", // violet-700
  "#2563eb", // blue-600
  "#ef4444", // red-500
  "#16a34a", // green-600
];

// start with fixed parameters
// const TARGET_PARAM = "Chlorobenzene (mg/L)";
// const SITES = ["Mo Ave. Well 2", "Mo Ave. Well 3", "Mo Ave. Well 4"];
// type Site = "Mo Ave. Well 2" | "Mo Ave. Well 3" | "Mo Ave. Well 4";

interface CsvRow {
  ParamName: string;
  Name: string;
  Start_Date: string; // for example: "10/1/2020 12:00:00 AM"
  Result_Value?: number | string; // Conentration
  [k: string]: unknown; // there could be more columns, type is unknown
}

// interface Point {
//   x: string; // mm/dd/yyyy in string format
//   y: number; // Result_value in number format
//   sort: number; // order of the data point
// }

type WidePoint = {
  date: string; // mm/dd/yyyy
  sort: number; // yyyymmdd
  [site: string]: string | number | undefined; // site name
};

export default function TimeSeriesPlot({
  targetParam,
  sites,
  csvPath = "/EStL_AllDataJoin.csv",
  colors = {},
  height = 440,
  compact = false,
}: TimeSeriesPlotProps) {
  // const [rows, setRows] = useState<CsvRow[]>([]);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({}); // site name -> hidden status

  // read CSV
  const { rows, loading, error } = useCsvData<CsvRow>(csvPath);

  const data: WidePoint[] = useMemo(() => {
    // date -> site -> values[]
    // "10/01/2020": { "ESL-MW-D1": [40], "ESL-MW-2D": [24], "ESL-MW-3D": [24], "ESL-MW-5D": [24] },
    const bucket = new Map<string, Map<string, number[]>>();
    const targetSet = new Set(sites);

    for (const r of rows) {
      if (r.ParamName !== targetParam) continue;
      if (!targetSet.has(r.Name)) continue;

      const mdy = toMDY(String(r.Start_Date ?? ""));
      if (!mdy) continue;

      const rawValue = r.Result_Value ?? (null as unknown);
      const v = coerceNumber(rawValue);
      if (v === null) continue;

      const site = r.Name;
      const inner = bucket.get(mdy) ?? new Map<string, number[]>();
      const arr = inner.get(site) ?? [];
      arr.push(v);
      inner.set(site, arr);
      bucket.set(mdy, inner);
    }

    const out: WidePoint[] = [];
    for (const [mdy, inner] of bucket) {
      const sort = mdySortKey(mdy);
      if (sort === null) continue;

      const row: WidePoint = { date: mdy, sort };
      for (const s of sites) {
        const arr = inner.get(s);
        if (arr && arr.length) {
          row[s] = arr.reduce((a, b) => a + b, 0) / arr.length;
        }
      }
      out.push(row);
    }

    // sort by date ascending
    out.sort((a, b) => a.sort - b.sort);
    return out;
  }, [rows, targetParam, sites]);

  // create a map of site colors
  const siteColor = useMemo(() => {
    const map: Record<string, string> = { ...colors }; //site name -> color
    let i = 0;
    for (const s of sites) {
      if (!map[s]) {
        // if the site color is not provided, use the default colors
        map[s] = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        i += 1;
      }
    }
    return map;
  }, [sites, colors]);

  function handleLegendClick(data: LegendPayload) {
    const key = typeof data.dataKey === "string" ? data.dataKey : undefined;
    if (!key) return;
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div
      className={
        compact
          ? "w-full space-y-2 p-4" // compact mode for popup
          : "mx-auto max-w-5xl space-y-4 p-6"
      }
    >
      <div>
        {!compact && (
          <h1 className="text-2xl font-semibold tracking-tight">
            {targetParam}
          </h1>
        )}

        {!compact && (
          <p className="text-sm text-muted-foreground">
            Site: {sites.join(", ")}
          </p>
        )}
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Data loading…</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!compact && (
        <div className="text-sm text-muted-foreground">
          {rows.length ? (
            <>
              Already loading <b>{rows.length.toLocaleString()}</b> rows，with{" "}
              <b>{data.length}</b> data points
            </>
          ) : (
            <>No data loaded</>
          )}
        </div>
      )}

      <div className="w-full rounded-2xl border p-1" style={{ height: height }}>
        {compact && (
          <div className="flex justify-center items-center font-bold">
            Depth to water table (ft)
          </div>
        )}
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                minTickGap={28}
                label={{
                  value: "Date",
                  position: "insideBottomRight",
                  offset: 0,
                  dy: 10,
                  fontWeight: "bold",
                }}
              />
              <YAxis
                label={{
                  value: targetParam,
                  position: "insideMiddle",
                  angle: -90,
                  offset: 0,
                  dx: -30,
                  fontWeight: "bold",
                }}
                width={compact ? 15 : undefined}
              />
              <Tooltip />
              <Legend
                onClick={handleLegendClick}
                formatter={(v) => {
                  return <span>{v}</span>;
                }}
              />
              {sites.map((s) => (
                <Line
                  key={s}
                  dataKey={s}
                  name={s}
                  stroke={siteColor[s]}
                  dot={true}
                  strokeWidth={2}
                  connectNulls
                  hide={hidden[s]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data found
          </div>
        )}
      </div>
    </div>
  );
}
