import { PreviewCard } from "@/components/welcome/PreviewCard";
import type { PreviewColumnSample } from "@/lib/welcomeContent";

interface PreviewColumnProps {
  column: PreviewColumnSample;
}

/** Decorative sample column rendered inside the welcome board preview. */
export function PreviewColumn({ column }: PreviewColumnProps) {
  return (
    <div className="w-72 shrink-0 md:w-auto bg-sunken rounded-lg p-2 flex flex-col gap-2">
      <div className="px-2 py-1 flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-ink">{column.title}</p>
        <span className="inline-flex items-center h-5 px-2 rounded-full bg-surface text-xs font-medium text-ink-muted">
          {column.cards.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {column.cards.map((card) => (
          <PreviewCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
