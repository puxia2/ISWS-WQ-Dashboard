import { useCsvData } from "@/components/csv-reader";
import { RiverLevelPlotProps } from "@/types/chart";
import { useMemo } from "react";
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import { coerceNumber, mdySortKey, toMDY } from "@/lib/date";

interface RiverCsvRow {
  Date: string; // for example: "10/1/2020 12:00:00 AM"
  Value?: number | string; // Gage height (ft)
  [k: string]: unknown; // there could be more columns, type is unknown
}

type RiverPoint = {
  dateLabel: string; // mm/dd/yyyy
  dateMs: number; // timestamp
  sort: number; // yyyymmdd
  value: number; // Gage height (ft)
};

export function RiverLevelPlot({
  csvPath,
  height = 220,
  xDomain,
  onDomainChange,
}: RiverLevelPlotProps) {
  const { rows, loading, error } = useCsvData<RiverCsvRow>(csvPath);

  const data: RiverPoint[] = useMemo(() => {
    const bucket = new Map<string, number[]>();

    for (const r of rows) {
      const mdy = toMDY(String(r.Date ?? ""));
      if (!mdy) continue;

      const v = coerceNumber(r.Value);
      if (v === null) continue;

      const arr = bucket.get(mdy) ?? [];
      arr.push(v);
      bucket.set(mdy, arr);
    }

    const out: RiverPoint[] = [];
    for (const [mdy, arr] of bucket) {
      const sort = mdySortKey(mdy);
      if (sort === null) continue;

      const ms = new Date(mdy).getTime();
      if (!Number.isFinite(ms)) continue;

      out.push({
        dateLabel: mdy,
        dateMs: ms,
        sort,
        value: arr.reduce((a, b) => a + b, 0) / arr.length,
      });
    }

    out.sort((a, b) => a.sort - b.sort);
    return out;
  }, [rows]);

  // ------------------------------------------------------------------
  // minYear, maxYear, and yearTicks for x axis ticks
  // ------------------------------------------------------------------
  const minYear = data.length ? new Date(data[0].dateMs).getFullYear() : 0;
  const maxYear = data.length
    ? new Date(data[data.length - 1].dateMs).getFullYear()
    : 0;

  const yearTicks = useMemo(() => {
    if (!data.length) return [];
    const arr: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      arr.push(new Date(y, 0, 1).getTime());
    }
    return arr;
  }, [data, minYear, maxYear]);

  // convert xDomain to startIndex / endIndex for Brush
  const brushIndices = useMemo(() => {
    if (!xDomain || !data.length) {
      return { startIndex: undefined, endIndex: undefined };
    }
    const [start, end] = xDomain;

    let startIndex = data.findIndex((d) => d.dateMs >= start);
    if (startIndex === -1) startIndex = 0;

    let endIndex = data.findIndex((d) => d.dateMs >= end);
    if (endIndex === -1) endIndex = data.length - 1;

    return { startIndex, endIndex };
  }, [data, xDomain]);

  if (loading) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
        Loading river level data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-sm text-destructive">
        Failed to load river level data due to {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
        No river level data
      </div>
    );
  }

  return (
    <div className="flex h-[400px] w-full flex-col gap-2 mt-4 p-4">
      <div className="flex items-center justify-center h-[32px] font-bold text-2xl">
        Daily Mississippi River Water Level (ft)
      </div>
      <div className="h-[calc(100%-32px)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 80, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dateMs"
              type="number"
              scale="time"
              // if xDomain is provided, use it; otherwise use our custom year range
              domain={
                xDomain
                  ? xDomain
                  : yearTicks.length
                  ? [yearTicks[0], yearTicks[yearTicks.length - 1]]
                  : ["auto", "auto"]
              }
              // explicitly specify each year's ticks to avoid missing years
              ticks={yearTicks.length ? yearTicks : undefined}
              tickFormatter={(value: number) => dayjs(value).format("YYYY")}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) =>
                dayjs(value as number).format("YYYY-MM-DD")
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={1.5}
              dot={false}
            />
            <Brush
              dataKey="dateMs"
              height={30}
              travellerWidth={10}
              tickFormatter={(value) =>
                dayjs(value as number).format("YYYY-MM")
              }
              startIndex={brushIndices.startIndex}
              endIndex={brushIndices.endIndex}
              onChange={(e: any) => {
                if (!e || !onDomainChange) return;
                const { startIndex, endIndex } = e;
                const start = data[startIndex]?.dateMs;
                const end = data[endIndex]?.dateMs;
                if (start != null && end != null) {
                  onDomainChange([start, end]);
                }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
