import type { ReactNode } from "react";
import { CalendarCheck, CheckCircle2, Search } from "lucide-react";
import { AuthBackgroundShell } from "@/components/auth/auth-background-shell";

type RegisterShellProps = {
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
    label: "Book with confidence",
    icon: CheckCircle2,
  },
];

export function RegisterShell({ children }: RegisterShellProps) {
  return (
    <AuthBackgroundShell
      badge="Get started"
      benefits={benefits}
      headline={
        <>
          <span className="block">Your workspace</span>
          <span className="block">
            <span className="text-[#BDEFE5]">starts</span> here.
          </span>
        </>
      }
      mobileHeadline="Your workspace starts here."
      supportingText="Create an account to discover resources, check availability, and manage your bookings."
    >
      {children}
    </AuthBackgroundShell>
  );
}
