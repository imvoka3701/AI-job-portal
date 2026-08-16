import { apiClient } from "@/lib/axios";
import type {
  CompanyContext,
  CompanyActivityPage,
  CompanyInvitation,
  CompanyMembership,
  Department,
  JobAssignment,
  JobAssignmentsBatch,
  MembershipRole,
  MembershipStatus,
} from "@/types/company";
import type { Job } from "@/types/job";

export async function getCompanyContext(): Promise<CompanyContext> {
  const { data } = await apiClient.get<CompanyContext>("/employer/company-context");
  return data;
}

export async function getTeamMembers(): Promise<CompanyMembership[]> {
  const { data } = await apiClient.get<CompanyMembership[]>("/employer/team/members");
  return data;
}

export async function getCompanyJobs(): Promise<Job[]> {
  const { data } = await apiClient.get<Job[]>("/employer/team/jobs");
  return data;
}

export async function getJobAssignments(jobId: number): Promise<JobAssignment> {
  const { data } = await apiClient.get<JobAssignment>(
    `/employer/team/jobs/${jobId}/assignments`,
  );
  return data;
}

export async function updateJobAssignments(
  jobId: number,
  membershipIds: number[],
): Promise<JobAssignment> {
  const { data } = await apiClient.put<JobAssignment>(
    `/employer/team/jobs/${jobId}/assignments`,
    { membership_ids: membershipIds },
  );
  return data;
}

export async function getJobAssignmentsBatch(): Promise<JobAssignmentsBatch> {
  const { data } = await apiClient.get<JobAssignmentsBatch>(
    "/employer/team/job-assignments",
  );
  return data;
}

export async function updateJobAssignmentsBatch(
  assignments: JobAssignment[],
): Promise<JobAssignmentsBatch> {
  const { data } = await apiClient.put<JobAssignmentsBatch>(
    "/employer/team/job-assignments",
    { assignments },
  );
  return data;
}

export async function getCompanyActivity(params: {
  action?: string;
  target_type?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<CompanyActivityPage> {
  const { data } = await apiClient.get<CompanyActivityPage>(
    "/employer/team/activity",
    { params },
  );
  return data;
}

export async function updateTeamMember(
  membershipId: number,
  payload: {
    member_role?: MembershipRole;
    department_id?: number | null;
    status?: MembershipStatus;
  },
): Promise<CompanyMembership> {
  const { data } = await apiClient.patch<CompanyMembership>(
    `/employer/team/members/${membershipId}`,
    payload,
  );
  return data;
}

export async function transferTeamOwnership(membershipId: number): Promise<CompanyMembership> {
  const { data } = await apiClient.post<CompanyMembership>(
    `/employer/team/members/${membershipId}/transfer-ownership`,
  );
  return data;
}

export async function createDepartment(payload: {
  name: string;
  description?: string;
}): Promise<Department> {
  const { data } = await apiClient.post<Department>("/employer/departments", payload);
  return data;
}

export async function updateDepartment(
  departmentId: number,
  payload: { name?: string; description?: string; is_active?: boolean },
): Promise<Department> {
  const { data } = await apiClient.patch<Department>(
    `/employer/departments/${departmentId}`,
    payload,
  );
  return data;
}

export async function getInvitations(): Promise<CompanyInvitation[]> {
  const { data } = await apiClient.get<CompanyInvitation[]>("/employer/team/invitations");
  return data;
}

export async function createInvitation(payload: {
  email: string;
  member_role: MembershipRole;
  department_id?: number;
}): Promise<CompanyInvitation> {
  const { data } = await apiClient.post<CompanyInvitation>(
    "/employer/team/invitations",
    payload,
  );
  return data;
}

export async function resendInvitation(invitationId: number): Promise<CompanyInvitation> {
  const { data } = await apiClient.post<CompanyInvitation>(
    `/employer/team/invitations/${invitationId}/resend`,
  );
  return data;
}

export async function revokeInvitation(invitationId: number): Promise<CompanyInvitation> {
  const { data } = await apiClient.post<CompanyInvitation>(
    `/employer/team/invitations/${invitationId}/revoke`,
  );
  return data;
}

export async function getInvitation(token: string): Promise<CompanyInvitation> {
  const { data } = await apiClient.get<CompanyInvitation>(`/employer/invitations/${token}`);
  return data;
}

export async function acceptInvitation(
  token: string,
  payload: { full_name?: string; password?: string },
): Promise<CompanyMembership> {
  const { data } = await apiClient.post<CompanyMembership>(
    `/employer/invitations/${token}/accept`,
    payload,
  );
  return data;
}

export async function declineInvitation(token: string): Promise<CompanyInvitation> {
  const { data } = await apiClient.post<CompanyInvitation>(
    `/employer/invitations/${token}/decline`,
  );
  return data;
}
