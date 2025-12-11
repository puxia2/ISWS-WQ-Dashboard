export type TimeSeriesPlotProps = {
  targetParam: string; // e.g. "Chlorobenzene (mg/L)"
  sites: readonly string[]; // e.g. ["Mo Ave. Well 2", "Mo Ave. Well 3", "Mo Ave. Well 4"]
  // ?: optional property === csvPath: string | undefined
  csvPath?: string; // e.g. "/EStL_AllDataJoin.csv"
  colors?: Record<string, string>; // e.g. { "Mo Ave. Well 2": "#b45309", "Mo Ave. Well 3": "#0f766e", "Mo Ave. Well 4": "#7c3aed" }
  height?: number; // height of the plot, default is 440
  compact?: boolean; // whether to show the plot in compact mode, default is false
};

export type BoxPlotProps = {
  targetParam: string; // parameter name
  csvPath?: string;
  height?: number; // height of the plot, default is 460
  margin?: { top: number; right: number; bottom: number; left: number };
  tickRotate?: number; // angle of the text on the x-axis, default is -30
  color?: string; // color of the box and the median line, default is #2563eb (tailwind blue-600)
  minCount?: number; // minimum number of samples to draw, default is 10
  scaleType?: "linear" | "log10"; // type of the y-axis scale, default is "linear" (linear or log10)
};

export interface BoxPlotSingleSiteProps {
  siteName: string;
  targetParam: string[];
  csvPath?: string;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  tickRotate?: number;
  color?: string;
  scaleType?: "linear" | "log10";
}

export type RiverLevelPlotProps = {
  csvPath: string;
  height?: number;
  xDomain?: [number, number];
  onDomainChange?: (domain: [number, number]) => void; // when the user drags the brush, update the xDomain with [startTime, endTime]
};
