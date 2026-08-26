export type UserRole = 'visitor' | 'user' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type Language = 'en' | 'ar' | 'tr';

export type IssueStatus =
  | 'submitted'
  | 'in_review'
  | 'accepted'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DbUser {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  language: Language;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbIssue {
  id: string;
  category_id: string;
  title: string;
  summary: string | null;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  priority: IssuePriority;
  report_count: number;
  supporter_count?: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  category?: DbCategory;
}

export interface DbReport {
  id: string;
  issue_id: string;
  user_id: string;
  category_id: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category?: DbCategory;
  user?: {
    id: string;
    display_name: string | null;
  };
}

export interface DbIssueSupporter {
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface DbIssueStatusHistory {
  id: string;
  issue_id: string;
  changed_by_user_id: string | null;
  from_status: IssueStatus | null;
  to_status: IssueStatus;
  note: string | null;
  created_at: string;
  changed_by?: {
    id: string;
    display_name: string | null;
    role: string;
  };
}

export interface ApiResponse<T = any> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
