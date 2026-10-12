import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

type EmptyStateProps = {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-md bg-blue-50 text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
