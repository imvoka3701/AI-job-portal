export type MembershipRole = "hr" | "department_head";
export type MembershipStatus = "active" | "suspended" | "revoked";
export type InvitationStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";
export type InvitationDeliveryStatus = "not_configured" | "pending" | "sent" | "failed" | "bounced";

export interface Company {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface Department {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface CompanyMembership {
  id: number;
  company_id: number;
  user_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  member_role: MembershipRole;
  department_id: number | null;
  department_name: string | null;
  status: MembershipStatus;
  is_owner: boolean;
  joined_at: string;
  updated_at: string;
}

export interface CompanyContext {
  company: Company;
  membership: CompanyMembership;
  permissions: string[];
  departments: Department[];
}

export interface CompanyInvitation {
  id: number;
  company_id: number;
  company_name: string;
  email: string;
  member_role: MembershipRole;
  department_id: number | null;
  department_name: string | null;
  status: InvitationStatus;
  delivery_status: InvitationDeliveryStatus;
  delivery_attempts: number;
  message_id: string | null;
  delivery_error: string | null;
  sent_at: string | null;
  bounced_at: string | null;
  expires_at: string;
  created_at: string;
  invite_token?: string;
  invite_path?: string;
}

export interface JobAssignment {
  job_id: number;
  membership_ids: number[];
}

export interface JobAssignmentsBatch {
  assignments: JobAssignment[];
}

export interface CompanyActivity {
  id: number;
  actor_user_id: number | null;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  details_json: Record<string, unknown>;
  created_at: string;
}

export interface CompanyActivityPage {
  items: CompanyActivity[];
  total: number;
  page: number;
  page_size: number;
}

export type RecruitmentRequestStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled";
export type RecruitmentPriority = "low" | "normal" | "high" | "urgent";

export interface RecruitmentRequest {
  id: number;
  company_id: number;
  department_id: number;
  department_name: string;
  requested_by_id: number;
  requester_name: string;
  requester_email: string;
  title: string;
  headcount: number;
  job_type: "full_time" | "part_time" | "internship" | "freelance" | "remote";
  priority: RecruitmentPriority;
  reason: string;
  responsibilities: string;
  requirements: string;
  target_start_date: string | null;
  status: RecruitmentRequestStatus;
  review_note: string | null;
  reviewed_by_id: number | null;
  reviewer_name: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  cancelled_at: string | null;
  converted_job_id: number | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentRequestPage {
  items: RecruitmentRequest[];
  total: number;
  page: number;
  page_size: number;
}

export interface RecruitmentRequestPayload {
  title: string;
  headcount: number;
  job_type: RecruitmentRequest["job_type"];
  priority: RecruitmentPriority;
  reason: string;
  responsibilities: string;
  requirements: string;
  target_start_date?: string;
  submit?: boolean;
}
