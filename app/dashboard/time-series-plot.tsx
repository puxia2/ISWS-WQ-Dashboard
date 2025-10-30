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
} from "recharts";
// import * as Papa from "papaparse";
import Papa from "papaparse";

// start with fixed parameters
const TARGET_PARAM = "1,1'-Biphenyl (ug/L)";
const TARGET_NAME = "GM-31A";

interface CsvRow {
  ParamName: string;
  Name: string;
  Start_Date: string; // 例如 "10/1/2020 12:00:00 AM"
  Result_Value?: number | string; // 实际列名
  Results_Value?: number | string; // 兼容可能的旧拼写
  [k: string]: unknown; // there could be more columns, type is unknown
}

interface Point {
  x: string; // mm/dd/yyyy in string format
  y: number; // Result_value in number format
  sort: number; // order of the data point
}

function toMDY(dateTime: string): string | null {
  if (!dateTime) return null;
  const first = String(dateTime).trim().split(/\s+/)[0] || ""; // "10/1/2020"
  const [mRaw, dRaw, yRaw] = first.split("/");
  if (!mRaw || !dRaw || !yRaw) return null;
  const mm = mRaw.padStart(2, "0");
  const dd = dRaw.padStart(2, "0");
  const yyyy = yRaw; // year is always 4 digits
  return `${mm}/${dd}/${yyyy}`;
}

function mdySortKey(mdy: string): number | null {
  // mdy: mm/dd/yyyy
  const [mm, dd, yyyy] = mdy.split("/");
  if (!mm || !dd || !yyyy) return null;
  const key = Number(`${yyyy}${mm}${dd}`);
  return Number.isFinite(key) ? key : null;
}

function coerceNumber(x: unknown): number | null {
  if (x === null || x === undefined || x === "") return null;
  const n = typeof x === "number" ? x : Number(String(x).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function TimeSeriesPlot() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Papa.parse<CsvRow>("/EStL_AllDataJoin.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || []).filter(Boolean);
        setRows(data);
        setLoading(false);
      },
      error: (err) => {
        setError("Error loading CSV: " + err.message);
        setLoading(false);
      },
    });
  }, []);

  const series: Point[] = useMemo(() => {
    const subset = rows.filter(
      (r) => r.ParamName === TARGET_PARAM && r.Name === TARGET_NAME
    );
    const pts: Point[] = [];
    for (const r of subset) {
      const mdy = toMDY(String(r.Start_Date));
      const rawValue = r.Result_Value;
      const val = coerceNumber(rawValue);
      if (!mdy || val === null) continue;
      const sKey = mdySortKey(mdy);
      if (sKey === null) continue;
      pts.push({ x: mdy, y: val, sort: sKey });
    }
    // sort in ascending order of yyyymmdd
    pts.sort((a, b) => a.sort - b.sort);
    return pts;
  }, [rows]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {TARGET_PARAM}
        </h1>
        <p className="text-muted-foreground">Site: {TARGET_NAME}</p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Data loading…</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="text-sm text-muted-foreground">
        {rows.length ? (
          <>
            Already loading <b>{rows.length.toLocaleString()}</b> rows，with{" "}
            <b>{series.length}</b> data points
          </>
        ) : (
          <>No data loaded</>
        )}
      </div>

      <div className="h-[440px] w-full rounded-2xl border p-3">
        {series.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
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
                  value: "Concentration (ug/L)",
                  position: "insideMiddle",
                  angle: -90,
                  offset: 0,
                  dx: -20,
                  fontWeight: "bold",
                }}
              />
              <Tooltip
                formatter={(value) => {
                  return [value, "Concentration (ug/L)"];
                }}
              />
              <Legend
                formatter={() => {
                  return <span>{TARGET_PARAM}</span>;
                }}
              />
              <Line
                type="monotone"
                name="Results_Value"
                dataKey="y"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
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
