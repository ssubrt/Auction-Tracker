"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Layout, 
  List, 
  PanelLeft, 
  Settings, 
  User, 
  UserPlus 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: Layout,
  },
  {
    name: "Ad Requests",
    href: "/requests",
    icon: List,
  },
  {
    name: "DSPs",
    href: "/dsps",
    icon: UserPlus,
  },
  {
    name: "Publishers",
    href: "/publishers",
    icon: User,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background pb-4 md:flex">
      <div className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <PanelLeft className="h-6 w-6" />
          <span>SSP Simulator</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-secondary/50 hover:text-secondary-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}