import { ChartNoAxesCombined, KeyboardIcon, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MenuItem } from "@/components/menu-item";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "dashboard",
  },
  {
    title: "Map",
    url: "/dashboard/map",
    icon: "map",
  },
  {
    title: "Query",
    url: "/dashboard/query",
    icon: "query",
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2">
        <div className="text-blue-950 font-bold">
          Illinois State Water Survey
        </div>
        <Image
          className="inline-block"
          src="/ISWS-Icon.png"
          alt="ISWS Water Quality Dashboard"
          width={40}
          height={40}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Getting Started</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton>
                    <MenuItem
                      item={
                        item as {
                          title: "Dashboard" | "Map" | "Query";
                          url: string;
                          icon: "dashboard" | "map" | "query";
                        }
                      }
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
