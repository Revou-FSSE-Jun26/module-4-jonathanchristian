import type {
  PreviewCardSample,
  PreviewLabelColor,
  PreviewStatusLabel,
} from "@/lib/welcomeContent";

const LABEL_COLOR_CLASSES: Record<PreviewLabelColor, string> = {
  green: "bg-label-green-bg text-label-green-fg",
  yellow: "bg-label-yellow-bg text-label-yellow-fg",
  orange: "bg-label-orange-bg text-label-orange-fg",
  red: "bg-label-red-bg text-label-red-fg",
  purple: "bg-label-purple-bg text-label-purple-fg",
  blue: "bg-label-blue-bg text-label-blue-fg",
  teal: "bg-label-teal-bg text-label-teal-fg",
  pink: "bg-label-pink-bg text-label-pink-fg",
};

const STATUS_CHIP_CLASSES: Record<PreviewStatusLabel, string> = {
  "Not started": "bg-sunken text-ink-muted",
  "In progress": "bg-primary-100 text-primary-700",
  Done: "bg-success-soft text-success",
};

interface PreviewCardProps {
  card: PreviewCardSample;
}

/** Decorative sample card rendered inside the welcome board preview. */
export function PreviewCard({ card }: PreviewCardProps) {
  const cardClasses = card.isDragged
    ? "bg-surface border border-primary-200 rounded-md p-3 flex flex-col gap-2 rotate-2 shadow-overlay"
    : "bg-surface border border-line rounded-md p-3 flex flex-col gap-2";

  return (
    <>
      <div className={cardClasses}>
        {card.labels.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {card.labels.map((label) => (
              <span
                key={label.text}
                className={`inline-flex items-center h-5 px-2 rounded-sm text-xs font-medium ${LABEL_COLOR_CLASSES[label.color]}`}
              >
                {label.text}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-sm font-medium text-ink">{card.title}</p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span
            className={`inline-flex items-center h-5 px-2.5 rounded-full text-xs font-medium ${STATUS_CHIP_CLASSES[card.status]}`}
          >
            {card.status}
          </span>
          <span
            className={`size-6 rounded-full inline-flex items-center justify-center text-xs font-medium ${LABEL_COLOR_CLASSES[card.avatarColor]}`}
          >
            {card.initials}
          </span>
        </div>
      </div>

      {card.showPlaceholderAfter ? (
        <div className="h-16 rounded-md border-2 border-dashed border-primary-200 bg-primary-50" />
      ) : null}
    </>
  );
}
