export type UserRole = 'Customer' | 'Agent' | 'Admin';

export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export const USER_ROLES: readonly UserRole[] = ['Customer', 'Agent', 'Admin'];

export const TICKET_STATUSES: readonly TicketStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed'];

export const TICKET_PRIORITIES: readonly TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TicketQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  page: number;
  pageSize: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

/** A user account as the administration screen sees it. Password data never reaches the browser. */
export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

/** The signed-in user, read from the claims of the access token. */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Expiry as milliseconds since the Unix epoch. */
  expiresAt: number;
}
