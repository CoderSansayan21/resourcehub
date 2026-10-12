import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/page-heading";

export const instant = false;

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        description="Search and filtering controls are staged for the future resource discovery workflow."
        eyebrow="Explore resources"
        title="Find the right space or equipment"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Discovery filters
              </h2>
              <p className="text-sm text-muted">
                UI placeholders only. Filtering will connect to real resources later.
              </p>
            </div>
            <Badge variant="blue">Preview controls</Badge>
          </div>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
          <Input
            disabled
            label="Search"
            placeholder="Room name, equipment, or location"
          />
          <Input disabled label="Resource type" placeholder="Meeting room" />
          <Input disabled label="Capacity" placeholder="Any capacity" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-950">
              Suggested browsing path
            </h2>
            <p className="text-sm text-muted">
              Designed around booking-first decision making.
            </p>
          </CardHeader>
          <ol className="space-y-4">
            {["Choose category", "Review fit", "Check availability"].map(
              (item, index) => (
                <li className="flex gap-3" key={item}>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item}</p>
                    <p className="text-sm leading-6 text-muted">
                      This step will become interactive when resource data is
                      available.
                    </p>
                  </div>
                </li>
              ),
            )}
          </ol>
          <ButtonLink className="mt-6" href="/availability" variant="secondary">
            Open availability preview
            <SlidersHorizontal aria-hidden="true" className="size-4" />
          </ButtonLink>
        </Card>

        <EmptyState
          action={
            <ButtonLink href="/availability" variant="secondary">
              View timeline scaffold
              <Filter aria-hidden="true" className="size-4" />
            </ButtonLink>
          }
          description="Resource cards will render here after CRUD and database queries are introduced."
          icon={Search}
          title="No resources loaded in this stage"
        />
      </div>
    </div>
  );
}
