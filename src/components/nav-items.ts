import {
  FileTextIcon,
  LayoutDashboardIcon,
  MailWarningIcon,
  RouteIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: "mismatch";
};

export const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Mismatch",
    href: "/mismatch",
    icon: MailWarningIcon,
    badge: "mismatch",
  },
  {
    title: "Track",
    href: "/track",
    icon: RouteIcon,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: FileTextIcon,
  },
];
