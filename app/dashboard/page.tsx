import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TimeSeriesPlot from "./time-series-plot";

export default function Dashboard() {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Time Series Plot of 1,1&apos;-Biphenyl Contamination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesPlot />
          </CardContent>
        </Card>
        <Card></Card>
      </div>
    </>
  );
}
