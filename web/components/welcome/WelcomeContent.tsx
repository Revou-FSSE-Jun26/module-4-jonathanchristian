const CAPABILITIES = [
  "Create Kanban boards with customizable columns and task cards",
  "Organize work smoothly with mouse and touch drag-and-drop",
  "Track card progress with statuses: Not started, In progress, and Done",
  "Assign tasks, set due dates, and tag cards with labels",
  "Collaborate directly on cards with threaded comments",
  "Search cards across a board or view all your assignments in My Tasks",
  "Share boards with editable member links or read-only guest invite links",
  "Monitor team progress with board analytics and real-time notifications",
];

/** Public Server Component introducing Kano and its core capabilities. */
export function WelcomeContent() {
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Welcome to Kano</h1>
        <p className="text-sm text-ink-muted max-w-prose">
          Kano is a focused, collaborative Kanban workspace for organizing projects and tracking
          team tasks from start to finish.
        </p>
      </div>

      <ul className="bg-surface border border-line rounded-lg p-6 flex flex-col gap-3 text-sm text-ink list-disc list-inside">
        {CAPABILITIES.map((item) => (
          <li key={item} className="min-w-0">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
