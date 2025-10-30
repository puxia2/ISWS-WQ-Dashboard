"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, MapPin, KeyboardIcon } from "lucide-react";

const icons = {
  dashboard: ChartNoAxesCombined,
  map: MapPin,
  query: KeyboardIcon,
};

interface SidebarItem {
  title: string;
  url: string;
  // react component
  // icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  icon: keyof typeof icons;
}

export function MenuItem({ item }: { item: SidebarItem }) {
  const Icon = icons[item.icon];

  const pathname = usePathname();
  const isActive = pathname === item.url;

  return (
    <Link
      href={item.url}
      className={cn(
        "flex items-center gap-2 px-2 py-1 text-[16px] text-brand-secondary font-medium hover:bg-gray-100 rounded-md",
        isActive &&
          "text-gray-900 bg-brand-primary hover:bg-brand-primary/90 w-full px-3"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.title}
    </Link>
  );
}
