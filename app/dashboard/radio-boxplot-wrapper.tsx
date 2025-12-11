"use client";

import ScaleSwitcher, { Scale } from "@/components/scale-switcher";
import { useState } from "react";
import BoxPlot from "../../plots/box-plot";

export default function RadioBoxplotWrapper() {
  const [scaleType, setScaleType] = useState<Scale>("linear");
  return (
    <div>
      <ScaleSwitcher
        value={scaleType}
        onChange={(value) => setScaleType(value)}
      />
      <BoxPlot
        targetParam="Total dissolved solids (mg/L )"
        csvPath="/EStL_AllDataJoin.csv"
        height={520}
        color="#7c3aed"
        minCount={5}
        scaleType={scaleType}
      />
    </div>
  );
}
