import { PreviewColumn } from "@/components/welcome/PreviewColumn";
import { PREVIEW_SAMPLE } from "@/lib/welcomeContent";

/** Decorative, non-interactive board illustration for the Welcome page. */
export function BoardPreview() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 min-w-0">
      <div className="bg-surface border border-line rounded-lg p-4 md:p-6 min-w-0">
        <div tabIndex={-1} className="overflow-x-auto min-w-0">
          <div
            aria-hidden="true"
            className="flex gap-4 md:grid md:grid-cols-3 min-w-0"
          >
            {PREVIEW_SAMPLE.map((column) => (
              <PreviewColumn key={column.id} column={column} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
