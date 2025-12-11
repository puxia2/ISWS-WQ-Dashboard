"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/multi-select";
import { useState, useMemo } from "react";
import { useCsvData } from "@/components/csv-reader";
import BoxPlotSingleSite from "@/plots/box-plot-single-site";

interface CsvRow {
  ParamName: string;
  Name: string;
  Start_Date: string; // 例如 "10/1/2020 12:00:00 AM"
  Result_Value?: number | string; // Conentration
  [k: string]: unknown; // there could be more columns, type is unknown
}
const csvPath = "/EStL_AllDataJoin.csv";

interface Site {
  name: string;
  station_id: number;
  organization: string;
  lat: number;
  lng: number;
  depth_qual: string;
}

export function DialogCard({ siteName }: { siteName: Site }) {
  const { rows, loading, error } = useCsvData<CsvRow>(csvPath);
  const [selectedugValues, setSelectedugValues] = useState<string[]>([]);
  const [selectedmgValues, setSelectedmgValues] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const normalize = (p: string) => p.replace(/\s+/g, " ").trim();

  const allParamsForSite = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .filter((row) => row.Name === siteName.name)
          .map((row) => normalize(String(row.ParamName).trim()))
      )
    );
  }, [rows, siteName.name]);

  const ugList = allParamsForSite.filter((p: string) => p.includes("(ug/L)"));
  const mgList = allParamsForSite.filter((p: string) => p.includes("(mg/L)"));

  const ug_options = useMemo(() => {
    return ugList.map((param) => {
      return {
        value: param,
        label: param,
      };
    });
  }, [ugList]);

  const mg_options = useMemo(() => {
    return mgList.map((param) => {
      return {
        value: param,
        label: param,
      };
    });
  }, [mgList]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <form>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-2 px-2 py-1 bg-gray-900 text-white rounded-xl"
          >
            View Boxplot of Different Parameters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Boxplot of Different Parameters</DialogTitle>
            <DialogDescription>
              Click on the dropdown menu below to select one or more parameters
              (up to 5) to start.
            </DialogDescription>
          </DialogHeader>

          <MultiSelect
            options={mg_options}
            onValueChange={setSelectedmgValues}
            defaultValue={selectedmgValues}
            modalPopover={true}
            popoverClassName="z-[10000]"
          />

          {dialogOpen && (
            <BoxPlotSingleSite
              key={`${siteName.name}-${selectedmgValues.join(",")}`}
              siteName={siteName.name}
              targetParam={selectedmgValues}
              height={460}
            />
          )}

          <MultiSelect
            options={ug_options}
            onValueChange={setSelectedugValues}
            defaultValue={selectedugValues}
            modalPopover={true}
            popoverClassName="z-[10000]"
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
