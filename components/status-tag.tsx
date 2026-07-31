import { cn } from "@/lib/utils";

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-alt text-muted-foreground" },
  active: { label: "En ligne", className: "bg-relais-975 text-relais" },
  matched: { label: "Mise en relation", className: "bg-blue-france-950 text-blue-france" },
  closed: { label: "Résolue", className: "bg-alt text-ink" },
  rejected: { label: "Masquée", className: "bg-soutien-975 text-soutien" },
};

export function StatusTag({ status }: { status: string }) {
  const tone = statusLabels[status] ?? {
    label: status,
    className: "bg-alt text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em]",
        tone.className,
      )}
    >
      {tone.label}
    </span>
  );
}
