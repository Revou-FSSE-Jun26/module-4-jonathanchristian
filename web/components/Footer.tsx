import { KanoMark } from "@/components/shared/KanoMark";
import { GithubIcon } from "@/components/shared/icons/GithubIcon";
import { LinkedinIcon } from "@/components/shared/icons/LinkedinIcon";
import { FOOTER_CONTENT } from "@/lib/footerContent";

const LINK_CLASS =
  "inline-flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

/** Global page footer (Server Component). */
export function Footer() {
  return (
    <footer className="bg-surface border-t border-line px-4 py-3 min-w-0">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <KanoMark />
          <span className="text-sm font-semibold text-ink">{FOOTER_CONTENT.wordmark}</span>
          <span aria-hidden="true" className="text-ink-subtle">
            ·
          </span>
          <p className="text-sm text-ink-muted min-w-0">
            {FOOTER_CONTENT.portfolioPrefix}
            <span className="font-medium text-ink">{FOOTER_CONTENT.author}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {FOOTER_CONTENT.links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={LINK_CLASS}
            >
              {link.id === "github" ? <GithubIcon /> : <LinkedinIcon />}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
