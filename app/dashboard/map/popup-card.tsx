"use client";

import { Popup, useMap } from "react-leaflet";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimestampSeriesPlot from "@/plots/time-series-plot";
import { DialogCard } from "./dialog-card";

interface Site {
  name: string;
  station_id: number;
  organization: string;
  lat: number;
  lng: number;
  depth_qual: string;
}

export default function PopupCard({
  site,
  isSelected,
}: {
  site: Site;
  isSelected: boolean;
}) {
  const map = useMap(); // get the map instance

  return (
    <Popup closeButton={false} autoClose={false} className="site-popup">
      <div className="relative rounded-xl overflow-hidden shadow-lg w-[360px]">
        {/* close button */}
        <Button
          className="absolute top-1 right-1 hover:text-white"
          onClick={() => map.closePopup()}
        >
          <X size={12} className="text-gray-500" />
        </Button>
        <div className="bg-gray-900 text-white pl-2 py-1 text-sm font-semibold">
          {site.name}
          <div className="text-gray-300 text-xs font-bold">
            Organization: {site.organization}
          </div>
        </div>
        <div className="bg-white p-3 text-xs text-gray-700">
          <div>
            {isSelected
              ? "Selected (click to deselect)"
              : "Not Selected (click to select)"}
          </div>
          <div>
            Depth of the screened interval: <strong>{site.depth_qual}</strong>
          </div>

          <div className="mt-2">
            <TimestampSeriesPlot
              targetParam="Gage Height (ft)"
              sites={[site.name]}
              height={200}
              compact={true}
            />
          </div>
          <div className="flex justify-center">
            <DialogCard siteName={site} />
          </div>
        </div>
      </div>
    </Popup>
  );
}
