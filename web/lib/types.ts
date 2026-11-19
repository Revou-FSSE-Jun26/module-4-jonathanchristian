export type Role = "admin" | "member";

export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_expires_in: number;
  user: User;
}

export interface RefreshResult {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: "loading" | "authenticated" | "anonymous";
}

export interface AuthContextValue extends AuthState {
  login(r: LoginResult): void;
  logout(): void;
  updateUser(u: User): void;
  setAccessToken(t: string): void;
}

export interface CardAssignee {
  user_id: string;
  name: string;
}

export interface Card {
  card_id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  labels: string[];
  assignee: CardAssignee | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  column_id: string;
  board_id: string;
  name: string;
  order: number;
  cards: Card[];
}

export interface BoardSummary {
  board_id: string;
  name: string;
  my_role: Role;
  created_at: string;
  updated_at?: string;
}

export interface BoardDetail extends BoardSummary {
  columns: Column[];
}

export interface Member {
  user_id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CardSearchResult extends Card {
  board_name: string;
  column_name: string;
}

export interface CommentAuthor {
  user_id: string;
  name: string;
}

export interface Comment {
  comment_id: string;
  card_id: string;
  content: string;
  author: CommentAuthor;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  notification_id: string;
  type: "assignment" | "comment";
  message: string;
  card_id: string;
  board_id: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPage {
  items: AppNotification[];
  page: number;
  per_page: number;
  total: number;
  unread_count: number;
}

export interface Analytics {
  cards_per_column: {
    column_id: string;
    name: string;
    count: number;
  }[];
  completed_this_week: number;
  member_activity: {
    user_id: string;
    name: string;
    assigned_cards: number;
    comments: number;
  }[];
}
