// File: components/box-plot.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as d3 from "d3";
import { BoxPlotSingleSiteProps } from "@/types/chart";

interface CsvRow {
  ParamName: string;
  Name: string;
  Start_Date: string;
  Result_Value?: number | string;
  [k: string]: unknown;
}

export default function BoxPlotSingleSite({
  siteName, // ⭐ 固定的站点
  targetParam, // ⭐ 多选参数数组
  csvPath = "/EStL_AllDataJoin.csv",
  height = 460,
  margin = { top: 24, right: 20, bottom: 64, left: 64 },
  tickRotate = -30,
  color = "#2563eb",
  scaleType = "linear",
}: BoxPlotSingleSiteProps) {
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
    param: string; // ⭐ 参数名（x 轴）
    count: number;
    min: number;
    q1: number;
    median: number;
    average: number;
    q3: number;
    max: number;
  };

  // ⭐ 对于一个固定的 site：
  // 1) 仅保留 Name===siteName 的记录
  // 2) 仅保留 ParamName 在 targetParam[] 里的记录
  // 3) 按 ParamName 分组，计算 box stats
  const stats: BoxStats[] = useMemo(() => {
    if (!rows.length || !siteName || !targetParam?.length) return [];

    const normalize = (s: string) => s.trim().replace(/\s+/g, " ");

    const siteNorm = normalize(siteName);
    const paramSet = new Set(
      targetParam.map((p) => normalize(String(p || ""))).filter(Boolean)
    );

    if (!paramSet.size) return [];

    // group by param -> values[]
    const groups = new Map<string, number[]>();

    for (const r of rows) {
      const rowSite = normalize(String(r.Name ?? ""));
      if (!rowSite || rowSite !== siteNorm) continue; // ⭐ 固定 site

      const paramNormalized = normalize(String(r.ParamName ?? ""));
      if (!paramNormalized || !paramSet.has(paramNormalized)) continue;

      const v = coerceNumber(r.Result_Value ?? null);
      if (v === null) continue;

      const arr = groups.get(paramNormalized) ?? [];
      arr.push(v);
      groups.set(paramNormalized, arr);
    }

    const out: BoxStats[] = [];
    groups.forEach((arr, param) => {
      if (!arr.length) return;
      const sorted = arr.slice().sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const q1 = d3.quantileSorted(sorted, 0.25)!;
      const median = d3.quantileSorted(sorted, 0.5)!;
      const average = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      const q3 = d3.quantileSorted(sorted, 0.75)!;
      out.push({
        param,
        count: sorted.length,
        min,
        q1,
        median,
        average,
        q3,
        max,
      });
    });

    // 默认按参数名字排序
    out.sort((a, b) => a.param.localeCompare(b.param));
    return out;
  }, [rows, siteName, targetParam]);

  // —— draw the plot —— //
  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    const tooltip = d3.select(tooltipRef.current);
    if (!container || !svgEl) return;

    // Wait for container to have a valid width (important in Dialog)
    const updateWidth = () => {
      const width = container.clientWidth || container.offsetWidth || 800;
      if (width === 0) {
        // If width is still 0, try again on next frame
        requestAnimationFrame(updateWidth);
        return;
      }

      const innerW = Math.max(0, width - margin.left - margin.right);
      const innerH = Math.max(0, height - margin.top - margin.bottom);

      const svg = d3.select(svgEl);
      // Clear previous content
      svg.selectAll("*").remove();

      // Set SVG dimensions
      svg
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("display", "block"); // Ensure SVG is displayed as block

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

      // ⭐ X 轴：参数名
      const x = d3
        .scaleBand<string>()
        .domain(stats.map((d) => d.param))
        .range([0, innerW])
        .padding(0.4);

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

      const boxWidth = Math.max(6, x.bandwidth() * 0.6);
      const whiskerWidth = Math.min(boxWidth, 24);

      const group = g.append("g").attr("class", "boxes");
      const fmt = d3.format(".3~f");

      stats.forEach((d) => {
        const cx = (x(d.param) ?? 0) + x.bandwidth() / 2;
        const q1y = y(d.q1);
        const q3y = y(d.q3);
        const medianY = y(d.median);
        const averageY = y(d.average);
        const minY = y(d.min);
        const maxY = y(d.max);

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
                  `<div><b>${d.param}</b> (n=${d.count})</div>` +
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

        group
          .append("line")
          .attr("x1", cx - boxWidth / 2)
          .attr("x2", cx + boxWidth / 2)
          .attr("y1", medianY)
          .attr("y2", medianY)
          .attr("stroke", color)
          .attr("stroke-width", 2);

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
    };

    // Initial render
    updateWidth();

    // Handle resize
    const ro = new ResizeObserver(() => {
      if (container && svgEl) {
        updateWidth();
      }
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
    };
  }, [stats, height, margin, tickRotate, color, scaleType]);

  const titleText =
    targetParam && targetParam.length
      ? `${siteName} – ${targetParam.length} parameters`
      : siteName;

  return (
    <div className="w-full">
      <div className="mb-2">
        <h2 className="text-lg font-semibold">{titleText}</h2>
        <p className="text-sm text-muted-foreground">
          Box plot by parameter (fixed site)
        </p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading data…</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border p-3"
        style={{ height, minWidth: "100%" }}
      >
        <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
        {/* remove tooltip for now */}
        {/* <div
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
        /> */}
        {!stats.length && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No data meets the condition
          </div>
        )}
      </div>
    </div>
  );
}
