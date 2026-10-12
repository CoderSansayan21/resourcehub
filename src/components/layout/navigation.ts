import {
  BarChart3,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Settings,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Resources",
    href: "/resources",
    icon: CalendarDays,
  },
  {
    label: "Reservations",
    href: "/reservations",
    icon: Clock3,
  },
  {
    label: "Availability",
    href: "/availability",
    icon: BarChart3,
  },
  {
    label: "Administration",
    href: "/admin",
    icon: Settings,
  },
];

export const navigationGroups = [
  {
    label: "Workspace",
    items: navigationItems.slice(0, 4),
  },
  {
    label: "Operations",
    items: navigationItems.slice(4),
  },
];
