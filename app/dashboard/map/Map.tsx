import {
  MapContainer,
  TileLayer,
  CircleMarker,
  LayersControl,
} from "react-leaflet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useCsvData } from "@/components/csv-reader";
import { useEffect, useMemo, useState } from "react";
import TimeSeriesPlot from "@/plots/time-series-plot";
import { Button } from "@/components/ui/button";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/styles";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBarIcon } from "lucide-react";
import PopupCard from "./popup-card";
import { RiverLevelPlot } from "@/plots/river-level-plot";
import dayjs from "dayjs";

const { BaseLayer } = LayersControl;

interface MyMapProps {
  position: [number, number];
  zoom: number;
}

interface mapRow {
  Lat: number;
  Long: number;
  Station_ID: number;
  Depth_Qual: string;
  Parameter_Code: number;
  ParamName: string;
  Name: string;
  Organization_Name: string;
  [k: string]: unknown;
}

interface Site {
  name: string;
  station_id: number;
  lat: number;
  lng: number;
  depth_qual: string;
  organization: string;
}

export default function MyMap({ position, zoom }: MyMapProps) {
  const { rows, loading, error } = useCsvData<mapRow>("/EStL_AllDataJoin.csv");
  // multiple sites can be selected at once, array of station_id
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [selectedParameterName, setSelectedParameterName] = useState<
    string | null
  >(null);
  const [domain, setDomain] = useState<[number, number] | undefined>(undefined);

  // Extract unique sites from CSV data
  const sites = useMemo(() => {
    const siteMap = new Map<number, Site>();

    for (const row of rows) {
      const lat = typeof row.Lat === "number" ? row.Lat : Number(row.Lat);
      const lng = typeof row.Long === "number" ? row.Long : Number(row.Long);
      const name = String(row.Name || "").trim();
      const station_id = Number(row.Station_ID || "");
      const organization = String(row.Organization_Name || "").trim();
      const depth_qual =
        String(row.Depth_Qual || "").trim() === "NULL"
          ? "Unknown"
          : String(row.Depth_Qual || "").trim();

      // Skip invalid data
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      // Use site name as key to ensure uniqueness
      // If same name appears with different coordinates, keep the first one
      if (!siteMap.has(station_id)) {
        siteMap.set(station_id, {
          name,
          station_id,
          lat,
          lng,
          depth_qual,
          organization,
        });
      }
    }

    return Array.from(siteMap.values());
  }, [rows]);

  // extract unique parameter name for each site from CSV data
  const parameterNames = useMemo(() => {
    const parameterNameMap = new Map<number, Set<string>>(); // station_id -> Set<parameterName>
    for (const row of rows) {
      const station_id = Number(row.Station_ID || "");
      const parameterName = String(row.ParamName || "").trim();
      if (!parameterName || !Number.isFinite(station_id)) continue;

      if (!parameterNameMap.has(station_id)) {
        parameterNameMap.set(station_id, new Set());
      }
      parameterNameMap.get(station_id)?.add(parameterName);
    }
    // Convert Set to Array for easier use
    const result = new Map<number, string[]>();
    parameterNameMap.forEach((paramSet, station_id) => {
      result.set(station_id, Array.from(paramSet));
    });
    return result;
  }, [rows]);

  // array of sites that are selected, each site is an object with name, station_id, lat, lng
  const selectedSites = useMemo(
    () => sites.filter((site) => selectedSiteIds.includes(site.station_id)),
    [sites, selectedSiteIds]
  );

  // array of parameter names that are available for allthe selected sites (intersection)
  const availableParameterNames = useMemo(() => {
    if (selectedSites.length === 0) return [];
    const paramArrays = selectedSiteIds.map(
      (station_id) => parameterNames.get(station_id) ?? []
    );
    if (paramArrays.length === 1) return paramArrays[0];
    const [first, ...rest] = paramArrays;
    return first.filter((param) => rest.every((arr) => arr.includes(param)));
  }, [selectedSiteIds, selectedSites, parameterNames]);

  // const selectedParameterNames = useMemo(
  //   () =>
  //     selectedSiteId !== null ? parameterNames.get(selectedSiteId) : undefined,
  //   [parameterNames, selectedSiteId]
  // );

  // if the selected parameter is still available, keep it (not reset)
  // otherwise, set the first parameter name as the selected parameter name when the site changes
  useEffect(() => {
    if (availableParameterNames.length === 0) {
      setSelectedParameterName(null);
      return;
    }

    setSelectedParameterName((prev) =>
      prev && availableParameterNames.includes(prev)
        ? prev
        : availableParameterNames[0]
    );
  }, [availableParameterNames]);

  // toggle the selection of a site: multi-select sites or cancel selection
  const toggleSiteSelection = (station_id: number) => {
    setSelectedSiteIds(
      (prev) =>
        prev.includes(station_id)
          ? prev.filter((id) => id !== station_id) // remove the site from the selection
          : [...prev, station_id] // add the site to the selection
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "800px", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Streets">
            {/* street map */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          <BaseLayer name="Satellite (Esri)">
            <TileLayer
              attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
        </LayersControl>

        {loading && (
          <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded shadow">
            Loading sites...
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-4 z-[1000] bg-red-100 text-red-800 p-2 rounded shadow">
            Error: {error}
          </div>
        )}

        <MarkerClusterGroup>
          {sites.map((site, index) => {
            const isSelected = selectedSiteIds.includes(site.station_id);
            return (
              <CircleMarker
                key={`${site.name}-${index}`}
                center={[site.lat, site.lng]}
                radius={isSelected ? 15 : 12}
                // use pathOptions to set the color and fill color of the circle
                // not working with color and fillColor props
                pathOptions={{
                  color: isSelected ? "blue" : "black", // border color
                  fillColor: isSelected ? "blue" : "red", // fill color
                  fillOpacity: isSelected ? 0.6 : 0.5,
                }}
                eventHandlers={{
                  click: () => {
                    toggleSiteSelection(site.station_id);
                  },
                  mouseover: (e) => e.target.openPopup(),
                }}
              >
                <PopupCard site={site} isSelected={isSelected} />
              </CircleMarker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSiteIds([]);
              setSelectedParameterName(null);
            }}
          >
            Reset
          </Button>

          <Select
            value={selectedParameterName ?? ""}
            onValueChange={(value) => setSelectedParameterName(value ?? null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a parameter" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Parameters</SelectLabel>
                {availableParameterNames?.map((param) => (
                  <SelectItem key={param} value={param}>
                    {param}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* <div className="grid grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base"># of Parameters</CardTitle>
              <CardContent>
                <div className="flex gap-2">
                  <ChartBarIcon />
                  <div className="text-5xl font-bold">
                    <div className="flex gap-2">
                      <div className="text-5xl font-bold">
                        {selectedParameterNames?.length ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        </div> */}

        <div className="col-span-1">
          <TimeSeriesPlot
            targetParam={selectedParameterName ?? ""}
            sites={selectedSites.map((site) => site.name)}
          />
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSiteIds([85, 86, 87, 93, 94, 95]);
              setSelectedParameterName("Chlorobenzene (ug/L)");
            }}
          >
            Select all GWE Sites
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedSiteIds([82, 83, 84, 549, 550, 551, 552]);
              setSelectedParameterName("Chlorobenzene (ug/L)");
            }}
          >
            Select all ESL Sites
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedSiteIds([
                68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 261,
              ]);
              setSelectedParameterName("Chlorobenzene (ug/L)");
            }}
          >
            Select all BWMW Sites
          </Button>
        </div>

        <RiverLevelPlot
          csvPath="/dv.csv"
          xDomain={domain}
          onDomainChange={setDomain}
        />

        {domain && (
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Start: {dayjs(domain[0]).format("YYYY-MM-DD")}</span>
            <span>End: {dayjs(domain[1]).format("YYYY-MM-DD")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
