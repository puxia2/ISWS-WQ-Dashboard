"use client";

import { usePathname } from "next/navigation";

export default function PageTitle() {
  const pathname = usePathname();
  const lastPart = pathname.split("/").pop();
  const title = lastPart
    ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
    : "Dashboard";
  return <h1 className="text-2xl font-bold p-2">ISWS Water Quality {title}</h1>;
}
