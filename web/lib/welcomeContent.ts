export const WELCOME_COPY = {
  metaTitle: "Welcome to Kano",
  metaDescription:
    "Organize work smoothly on Kanban boards with drag and drop, card statuses, comments, notifications, My Tasks, invitation links, and board analytics.",
  heroEyebrow: "Kanban boards for teams",
  heroHeadline: "Organize work smoothly, from idea to done",
  heroSubheadline:
    "Plan work on boards and columns, move cards by drag and drop, and keep your team aligned with comments, notifications, and invitation links.",
  heroCtaLabel: "Get started",
  heroCtaTarget: "/register" as const,
  featuresHeading: "Everything your team needs to execute",
  featuresSubheading:
    "Kano keeps boards simple so your team can focus on what to do next.",
  ctaHeading: "Ready to bring calm to your project planning?",
  ctaSubheading:
    "Create an account to start your first board, or log in to pick up where you left off.",
  ctaPrimaryLabel: "Create account",
  ctaPrimaryTarget: "/register" as const,
  ctaSecondaryLabel: "Log in",
  ctaSecondaryTarget: "/login" as const,
} as const;

export type FeatureIconName = "Move" | "Tag" | "Users" | "Search";

export interface WelcomeFeature {
  icon: FeatureIconName;
  title: string;
  description: string;
}

export const FEATURES: readonly WelcomeFeature[] = [
  {
    icon: "Move",
    title: "Drag and drop on mouse and touch",
    description:
      "Move cards between columns with a mouse or by touch, and Kano keeps the order you chose.",
  },
  {
    icon: "Tag",
    title: "Stay organized at a glance",
    description:
      "Add labels, due dates, and a status (Not started, In progress, or Done) to every card.",
  },
  {
    icon: "Users",
    title: "Collaborate with your team",
    description:
      "Comment on cards, get notifications about assignments and comments, and invite members or read-only guests with a link.",
  },
  {
    icon: "Search",
    title: "Find and focus",
    description:
      "Search the cards of a board, see the cards assigned to you in My Tasks, and let board admins view analytics.",
  },
] as const;

export type PreviewLabelColor =
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "blue"
  | "teal"
  | "pink";

export type PreviewStatusLabel = "Not started" | "In progress" | "Done";

export interface PreviewCardSample {
  id: string;
  title: string;
  labels: readonly { text: string; color: PreviewLabelColor }[];
  initials: string;
  avatarColor: PreviewLabelColor;
  status: PreviewStatusLabel;
  isDragged?: boolean;
  showPlaceholderAfter?: boolean;
}

export interface PreviewColumnSample {
  id: string;
  title: string;
  cards: readonly PreviewCardSample[];
}

export const PREVIEW_SAMPLE: readonly PreviewColumnSample[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      {
        id: "c1",
        title: "Draft the project brief",
        labels: [{ text: "Planning", color: "blue" }],
        initials: "AK",
        avatarColor: "purple",
        status: "Not started",
      },
      {
        id: "c2",
        title: "Prepare onboarding notes",
        labels: [
          { text: "Docs", color: "teal" },
          { text: "Team", color: "green" },
        ],
        initials: "BL",
        avatarColor: "orange",
        status: "Not started",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In progress",
    cards: [
      {
        id: "c3",
        title: "Design the login page",
        labels: [{ text: "UI", color: "purple" }],
        initials: "CM",
        avatarColor: "blue",
        status: "In progress",
        isDragged: true,
        showPlaceholderAfter: true,
      },
      {
        id: "c4",
        title: "Review sprint tasks",
        labels: [{ text: "Review", color: "yellow" }],
        initials: "AK",
        avatarColor: "pink",
        status: "In progress",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      {
        id: "c5",
        title: "Set up the database",
        labels: [{ text: "Setup", color: "green" }],
        initials: "BL",
        avatarColor: "teal",
        status: "Done",
      },
      {
        id: "c6",
        title: "Invite project members",
        labels: [{ text: "Access", color: "pink" }],
        initials: "CM",
        avatarColor: "green",
        status: "Done",
      },
    ],
  },
] as const;
