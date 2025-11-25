"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function Map() {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/app/dashboard/map/Map"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <Map position={[38.61741, -90.1646]} zoom={13} />
    </div>
  );
}
