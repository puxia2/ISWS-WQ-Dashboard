import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TimeSeriesPlot from "../../plots/time-series-plot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BoxPlot from "../../plots/box-plot";

import RadioBoxplotWrapper from "./radio-boxplot-wrapper";

export default function Dashboard() {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Time Series Plot of Chlorobenzene Contamination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ug/l">
              <TabsList>
                <TabsTrigger value="ug/l">Chlorobenzene (ug/L)</TabsTrigger>
                <TabsTrigger value="mg/l">Chlorobenzene (mg/L)</TabsTrigger>
              </TabsList>
              <TabsContent value="mg/l">
                <TimeSeriesPlot
                  targetParam="Chlorobenzene (mg/L)"
                  sites={["Mo Ave. Well 2", "Mo Ave. Well 3", "Mo Ave. Well 4"]}
                />
              </TabsContent>
              <TabsContent value="ug/l">
                <TimeSeriesPlot
                  targetParam="Chlorobenzene (ug/L)"
                  sites={["ESL-MW-D1"]}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Box Plot of Sulfate (mg/L) Contamination</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="TDS">
              <TabsList>
                <TabsTrigger value="TDS">
                  Total Dissolved Solids (mg/L)
                </TabsTrigger>
                <TabsTrigger value="sulfate">Sulfate as SO4 (mg/L)</TabsTrigger>
              </TabsList>
              <TabsContent value="TDS">
                <RadioBoxplotWrapper />
              </TabsContent>
              <TabsContent value="sulfate">
                <BoxPlot
                  targetParam="Sulfate as SO4 (mg/l)"
                  csvPath="/EStL_AllDataJoin.csv"
                  height={520}
                  color="#7c3aed" // violet-700
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
