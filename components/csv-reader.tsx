"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";

// Generic type T represents the type of one row of CSV data
export function useCsvData<T>(csvPath: string, config?: Papa.ParseConfig<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!csvPath) return;

    setLoading(true);
    setError(null);

    Papa.parse<T>(csvPath, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      ...config, // allow you to override the default configuration
      complete: (res) => {
        const data = (res.data || []).filter(Boolean as any) as T[];
        setRows(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
  }, [csvPath]);

  return { rows, loading, error };
}
