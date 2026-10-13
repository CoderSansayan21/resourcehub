import type { ReactNode } from "react";
import { CalendarCheck, ClipboardList, Search } from "lucide-react";
import { AuthBackgroundShell } from "@/components/auth/auth-background-shell";

type LoginShellProps = {
  children: ReactNode;
};

const benefits = [
  {
    label: "Discover resources",
    icon: Search,
  },
  {
    label: "Check availability",
    icon: CalendarCheck,
  },
  {
    label: "Manage bookings",
    icon: ClipboardList,
  },
];

export function LoginShell({ children }: LoginShellProps) {
  return (
    <AuthBackgroundShell
      badge="Welcome back"
      benefits={benefits}
      headline={
        <>
          <span className="block">
            Your <span className="text-[#BDEFE5]">workspace.</span>
          </span>
          <span className="block">Ready when you are.</span>
        </>
      }
      mobileHeadline="Your workspace is ready."
      supportingText="Sign in to discover resources, check availability, and manage your reservations."
    >
      {children}
    </AuthBackgroundShell>
  );
}
