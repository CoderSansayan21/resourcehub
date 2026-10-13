import Image from "next/image";
import { AdminResourceManager } from "@/components/admin/admin-resource-manager";
import { requireRole } from "@/lib/authorization";

export const instant = false;

export default async function AdminPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-8">
      <section className="relative isolate min-h-[290px] overflow-hidden rounded-[1.75rem] bg-[#063B3A] shadow-xl shadow-teal-950/10 sm:min-h-[320px]">
        <Image
          alt="A modern workplace resource management environment"
          className="object-cover object-center"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          src="/images/admin/resource-management-hero.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#063B3A]/97 via-[#063B3A]/76 to-[#063B3A]/15" />
        <div className="relative flex min-h-[290px] max-w-2xl flex-col justify-center px-6 py-10 text-white sm:min-h-[320px] sm:px-10 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#BDEFE5]">
            Resource management
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Manage workspace resources
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            Create, maintain, activate, and pause the resources members can reserve. Deactivation hides a resource from members while preserving its history.
          </p>
        </div>
      </section>

      <AdminResourceManager />
    </div>
  );
}
