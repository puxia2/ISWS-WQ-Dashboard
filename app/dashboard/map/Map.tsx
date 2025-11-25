import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
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
import TimeSeriesPlot from "../time-series-plot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBarIcon } from "lucide-react";

interface MyMapProps {
  position: [number, number];
  zoom: number;
}

interface mapRow {
  Lat: number;
  Long: number;
  Station_ID: number;
  Parameter_Code: number;
  ParamName: string;
  Name: string;
  [k: string]: unknown;
}

interface Site {
  name: string;
  station_id: number;
  lat: number;
  lng: number;
}

export default function MyMap({ position, zoom }: MyMapProps) {
  const { rows, loading, error } = useCsvData<mapRow>("/EStL_AllDataJoin.csv");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedParameterName, setSelectedParameterName] = useState<
    string | null
  >(null);

  // Extract unique sites from CSV data
  const sites = useMemo(() => {
    const siteMap = new Map<number, Site>();

    for (const row of rows) {
      const lat = typeof row.Lat === "number" ? row.Lat : Number(row.Lat);
      const lng = typeof row.Long === "number" ? row.Long : Number(row.Long);
      const name = String(row.Name || "").trim();
      const station_id = Number(row.Station_ID || "");

      // Skip invalid data
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      // Use site name as key to ensure uniqueness
      // If same name appears with different coordinates, keep the first one
      if (!siteMap.has(station_id)) {
        siteMap.set(station_id, { name, station_id, lat, lng });
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

  const selectedSite = useMemo(
    () => sites.find((site) => site.station_id === selectedSiteId),
    [sites, selectedSiteId]
  );

  const selectedParameterNames = useMemo(
    () =>
      selectedSiteId !== null ? parameterNames.get(selectedSiteId) : undefined,
    [parameterNames, selectedSiteId]
  );

  // set the first parameter name as the selected parameter name when the site changes
  useEffect(() => {
    if (selectedParameterNames && selectedParameterNames.length > 0) {
      setSelectedParameterName(selectedParameterNames[0]);
    }
  }, [selectedParameterNames, setSelectedParameterName]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
        {sites.map((site, index) => (
          <CircleMarker
            key={`${site.name}-${index}`}
            center={[site.lat, site.lng]}
            radius={7}
            color="black"
            fillColor="red"
            fillOpacity={0.5}
            eventHandlers={{
              click: () => {
                setSelectedSiteId(site.station_id);
                setSelectedParameterName(null); // reset parameter selection when site changes
              },
            }}
          >
            <Tooltip>
              <div>
                <strong>{site.name}</strong>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <div>
        <div className="flex justify-end">
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
                {selectedParameterNames?.map((param) => (
                  <SelectItem key={param} value={param}>
                    {param}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              {/* <CardTitle># of Samples for this parameter: {samples.length}</CardTitle> */}
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
        </div>
        <div className="col-span-1">
          <TimeSeriesPlot
            targetParam={selectedParameterName ?? ""}
            sites={selectedSite ? [selectedSite.name] : []}
          />
          {/* <h3>Parameter Names: {selectedParameterNames?.join(", ")}</h3> */}
        </div>
      </div>
    </div>
  );
}
