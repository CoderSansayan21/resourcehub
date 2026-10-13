import {
  BarChart3,
  CalendarDays,
  ClipboardList,
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

export const memberNavigationGroups = [
  {
    label: "Workspace",
    items: navigationItems.slice(0, 4),
  },
];

export const adminNavigationGroups = [
  {
    label: "Workspace management",
    items: [
      navigationItems[0],
      {
        label: "Manage Resources",
        href: "/admin",
        icon: Settings,
      },
      {
        label: "Manage Reservations",
        href: "/reservations",
        icon: ClipboardList,
      },
    ],
  },
];

export function getNavigationGroups(role: "ADMIN" | "MEMBER") {
  return role === "ADMIN" ? adminNavigationGroups : memberNavigationGroups;
}
