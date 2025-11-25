// File: components/box-plot.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as d3 from "d3";
import { BoxPlotProps } from "@/types/chart";

interface CsvRow {
  ParamName: string;
  Name: string;
  Start_Date: string;
  Result_Value?: number | string;
  [k: string]: unknown;
}

export default function BoxPlot({
  targetParam,
  csvPath = "/EStL_AllDataJoin.csv",
  height = 460,
  margin = { top: 24, right: 20, bottom: 64, left: 64 },
  tickRotate = -30,
  color = "#2563eb",
  minCount = 10,
  scaleType = "linear",
}: BoxPlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // read CSV
  useEffect(() => {
    setLoading(true);
    Papa.parse<CsvRow>(csvPath, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || []).filter((row): row is CsvRow =>
          Boolean(row)
        );
        setRows(data);
        setLoading(false);
      },
      error: (err) => {
        setError("Failed to load CSV: " + err.message);
        setLoading(false);
      },
    });
  }, [csvPath]);

  function coerceNumber(x: unknown): number | null {
    if (x === null || x === undefined || x === "") return null;
    const n = typeof x === "number" ? x : Number(String(x).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  type BoxStats = {
    site: string;
    count: number;
    min: number;
    q1: number;
    median: number;
    average: number;
    q3: number;
    max: number;
  };

  // 1) filter specified Param; 2) group by Name; 3) calculate box stats for each site
  const stats: BoxStats[] = useMemo(() => {
    const targetNormalized = targetParam.trim().replace(/\s+/g, " ");
    // group by site -> values[]
    const groups = new Map<string, number[]>();

    for (const r of rows) {
      const paramNormalized = String(r.ParamName ?? "")
        .trim()
        .replace(/\s+/g, " ");
      if (!paramNormalized) continue;
      if (paramNormalized !== targetNormalized) continue;
      const raw = r.Result_Value ?? (null as unknown);
      const v = coerceNumber(raw);
      if (v === null) continue;
      const site = r.Name?.toString().trim();
      if (!site) continue;
      const arr = groups.get(site) ?? [];
      arr.push(v);
      groups.set(site, arr);
    }

    const out: BoxStats[] = [];
    groups.forEach((arr, site) => {
      if (!arr.length) return;
      if (arr.length < minCount) return; // filter sites with less than minCount samples
      const sorted = arr.slice().sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const q1 = d3.quantileSorted(sorted, 0.25)!;
      const median = d3.quantileSorted(sorted, 0.5)!;
      const average = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      const q3 = d3.quantileSorted(sorted, 0.75)!;
      out.push({
        site,
        count: sorted.length,
        min,
        q1,
        median,
        average,
        q3,
        max,
      });
    });

    // sort by site name by default;
    // if sort by median: out.sort((a,b)=>a.median-b.median)
    out.sort((a, b) => a.site.localeCompare(b.site));
    return out;
  }, [rows, targetParam, minCount]);

  // —— draw the plot ——
  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    const tooltip = d3.select(tooltipRef.current);
    if (!container || !svgEl) return;

    const width = container.clientWidth;
    const innerW = Math.max(0, width - margin.left - margin.right);
    const innerH = Math.max(0, height - margin.top - margin.bottom);

    // clear the svg
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!stats.length) return;

    // Y axis range
    const yMin = d3.min(stats, (d) => d.min)!;
    const yMax = d3.max(stats, (d) => d.max)!;
    const positiveMin = d3.min(stats, (d) => (d.min > 0 ? d.min : undefined));
    const useLog = scaleType === "log10" && positiveMin !== undefined;

    const y = useLog
      ? d3
          .scaleLog()
          .base(10)
          .domain([positiveMin!, yMax])
          .range([innerH, 0])
          .nice()
      : d3
          .scaleLinear()
          .domain([Math.min(0, yMin), yMax])
          .range([innerH, 0])
          .nice();

    const yAxis = useLog
      ? d3.axisLeft(y).ticks(6, "~g")
      : d3.axisLeft(y).ticks(6);

    // X axis: site (category)
    const x = d3
      .scaleBand<string>()
      .domain(stats.map((d) => d.site))
      .range([0, innerW])
      .padding(0.4);

    // x axis & grid
    const xAxis = d3.axisBottom(x);

    const yAxisGroup = g.append<SVGGElement>("g").attr("class", "y-axis");
    yAxisGroup
      .call(yAxis)
      .call((selection) =>
        selection
          .selectAll(".tick line")
          .clone()
          .attr("x1", 0)
          .attr("x2", innerW)
          .attr("stroke-opacity", 0.1)
      )
      .call((selection) => selection.select(".domain").remove());

    const xAxisG = g
      .append<SVGGElement>("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis);
    if (tickRotate) {
      xAxisG
        .selectAll<HTMLTextAreaElement, unknown>(".tick text")
        .attr("text-anchor", "end")
        .attr("transform", `rotate(${tickRotate}) translate(-6,0)`);
    }

    // size parameters
    const boxWidth = Math.max(6, x.bandwidth() * 0.6); // box width
    const whiskerWidth = Math.min(boxWidth, 24); // whiskers cap width

    // draw the box plot for each site
    const group = g.append("g").attr("class", "boxes");

    const fmt = d3.format(".3~f");

    stats.forEach((d) => {
      const cx = (x(d.site) ?? 0) + x.bandwidth() / 2; // center x
      const q1y = y(d.q1);
      const q3y = y(d.q3);
      const medianY = y(d.median);
      const averageY = y(d.average);
      const minY = y(d.min);
      const maxY = y(d.max);

      // box (Q1-Q3)
      group
        .append("rect")
        .attr("x", cx - boxWidth / 2)
        .attr("y", q3y)
        .attr("width", boxWidth)
        .attr("height", Math.max(1, q1y - q3y))
        .attr("fill", color)
        .attr("fill-opacity", 0.15)
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .on("pointerenter", () => {
          tooltip
            .style("opacity", 1)
            .html(
              `<div style="color:#111">` +
                `<div><b>${d.site}</b> (n=${d.count})</div>` +
                `<div>min: ${fmt(d.min)}</div>` +
                `<div>Q1: ${fmt(d.q1)}</div>` +
                `<div>median: ${fmt(d.median)}</div>` +
                `<div>average: ${fmt(d.average)}</div>` +
                `<div>Q3: ${fmt(d.q3)}</div>` +
                `<div>max: ${fmt(d.max)}</div>` +
                `</div>`
            );
        })
        .on("pointermove", (event: PointerEvent) => {
          const { clientX, clientY } = event;
          tooltip
            .style("left", `${clientX + 12}px`)
            .style("top", `${clientY + 12}px`);
        })
        .on("pointerleave", () => tooltip.style("opacity", 0));

      // median line
      group
        .append("line")
        .attr("x1", cx - boxWidth / 2)
        .attr("x2", cx + boxWidth / 2)
        .attr("y1", medianY)
        .attr("y2", medianY)
        .attr("stroke", color)
        .attr("stroke-width", 2);

      // whiskers: Q1→min; Q3→max
      group
        .append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", q1y)
        .attr("y2", minY)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      group
        .append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", q3y)
        .attr("y2", maxY)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // whiskers cap: min & max horizontal line
      group
        .append("line")
        .attr("x1", cx - whiskerWidth / 2)
        .attr("x2", cx + whiskerWidth / 2)
        .attr("y1", minY)
        .attr("y2", minY)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      group
        .append("line")
        .attr("x1", cx - whiskerWidth / 2)
        .attr("x2", cx + whiskerWidth / 2)
        .attr("y1", maxY)
        .attr("y2", maxY)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      group
        .append("circle")
        .attr("cx", cx)
        .attr("cy", averageY)
        .attr("fill", "red")
        .attr("r", 2);
    });

    // responsive observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      d3.select(svgEl).attr("width", w);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [stats, height, margin, tickRotate, color, scaleType]);

  return (
    <div className="w-full">
      <div className="mb-2">
        <h2 className="text-lg font-semibold">{targetParam}</h2>
        <p className="text-sm text-muted-foreground">
          Box Plot by Site（n ≥ {minCount}）
        </p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading data…</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border p-3"
        style={{ height }}
      >
        <svg ref={svgRef} />
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            opacity: 0,
            pointerEvents: "none",
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        {!stats.length && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No data meets the condition
          </div>
        )}
      </div>
    </div>
  );
}
