"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type Scale = "linear" | "log10";

interface ScaleSwitcherProps {
  value: Scale;
  onChange: (value: Scale) => void;
}

export default function ScaleSwitcher({ value, onChange }: ScaleSwitcherProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange((next as Scale) ?? "linear")}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="linear" id="r1" />
          <Label htmlFor="r1">Linear</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="log10" id="r2" />
          <Label htmlFor="r2">Log</Label>
        </div>
      </div>
    </RadioGroup>
  );
}
