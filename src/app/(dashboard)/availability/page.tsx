import { CalendarRange, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export const instant = false;

const hours = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"];
const rows = ["Resource A", "Resource B", "Resource C"];

export default function AvailabilityPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        description="A visual timeline scaffold for checking open slots before reservation creation. It is a preview only."
        eyebrow="Availability"
        title="Inspect availability before booking"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Timeline preview
              </h2>
              <p className="text-sm leading-6 text-muted">
                Empty state scaffold. No real reservations or availability data are
                connected.
              </p>
            </div>
            <Badge variant="blue">Preview layout</Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[720px] bg-white">
            <div className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-border bg-slate-50">
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Resource
              </div>
              {hours.map((hour) => (
                <div
                  className="border-l border-border px-4 py-3 text-xs font-semibold text-slate-600"
                  key={hour}
                >
                  {hour}
                </div>
              ))}
            </div>
            {rows.map((row, rowIndex) => (
              <div
                className="grid min-h-20 grid-cols-[150px_repeat(6,1fr)] border-b border-border last:border-b-0"
                key={row}
              >
                <div className="flex items-center px-4 text-sm font-semibold text-slate-900">
                  {row}
                </div>
                {hours.map((hour, hourIndex) => {
                  const highlighted = rowIndex === 1 && hourIndex > 1 && hourIndex < 4;
                  return (
                    <div
                      className="border-l border-border p-2"
                      key={`${row}-${hour}`}
                    >
                      <div
                        className={
                          highlighted
                            ? "h-full rounded-md border border-blue-200 bg-blue-50"
                            : "h-full rounded-md border border-dashed border-slate-200 bg-slate-50"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Highlighted blocks demonstrate where selected or occupied slots may be
            represented later. They are not real bookings.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-primary">
              <CalendarRange aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Future selection panel
              </h2>
              <p className="text-sm text-muted">
                Time selection and confirmation will be added after booking logic.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
