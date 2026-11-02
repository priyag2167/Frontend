export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Account {
  locale?: string;
  id: string;
  email: string;
  displayName: string;
  timeZone: string;
}
export interface Session {
  user: Account;
  roles: string[];
  permissions: string[];
}
export interface Lookup {
  id: string;
  displayName?: string;
  name?: string;
  code?: string;
}
export interface Hcp {
  portalUserId: string | null;
  portalUserName: string | null;
  id: string;
  fullName: string;
  specialty: string;
  institutionName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  professionalRegistrationId: string | null;
  assignedRepId: string;
  assignedRepName: string;
  territoryId: string | null;
  territoryName: string | null;
  contactAllowed: boolean;
  consentMetadata: { communicationPreferences?: string };
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Engagement {
  id: string;
  hcpId: string;
  hcpName: string;
  institutionName: string;
  ownerUserId: string;
  ownerName: string;
  engagementType: string;
  channel: string;
  subject: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  locationText: string | null;
  version: number;
  callReportId: string | null;
}
export interface FollowUp {
  id: string;
  title: string;
  description: string | null;
  hcpId: string | null;
  hcpName: string | null;
  assignedTo: string;
  assigneeName: string;
  priority: number;
  status: string;
  dueAt: string;
  completedAt: string | null;
  version: number;
}
export interface CallReport {
  version: number;
  amendments?: {
    id: string;
    reason: string;
    createdAt: string;
    authorName: string;
    previousRecord: unknown;
  }[];
  id: string;
  engagementId: string;
  hcpName: string;
  submittedByName: string;
  submittedBy: string;
  submittedAt: string;
  interactionNotes: string;
  outcome: string;
  questionsRaised: string | null;
  reviewStatus: string;
  reviewComments: string | null;
  reviewedAt: string | null;
  channel: string;
  subject: string;
  actualStart: string;
  actualEnd: string;
  materials: { id: string; title: string; version: number }[];
}
export interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  description: string | null;
  audience: string;
  status: string;
  ownerUserId: string;
  ownerName: string;
  currentVersionId: string;
  versionNumber: number;
  fileName: string;
  checksumSha256: string;
  scanStatus: string;
  effectiveAt: string | null;
  expiresAt: string | null;
  version: number;
  updatedAt: string;
  history?: {
    decision: string;
    comments: string;
    decidedAt: string;
    reviewerName: string;
    versionNumber: number;
  }[];
}
export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  ownerUserId: string;
  passThreshold: number;
  maxAttempts: number;
  retrainingDays: number;
  courseVersionId: string;
  versionNumber: number;
  learningObjectives: string;
  simulationProvider: string | null;
  simulationAssetRef: string | null;
}
export interface Assignment {
  available: boolean;
  contentVersionId: string | null;
  id: string;
  userId: string;
  userName: string;
  status: string;
  dueAt: string;
  completedAt: string | null;
  title: string;
  passThreshold: number;
  maxAttempts: number;
  courseVersionId: string;
  simulationProvider: string | null;
  learningObjectives: string;
  attemptsUsed: number;
  lastScore: number | null;
}
export interface Dashboard {
  counts: {
    planned: number;
    completed: number;
    scheduled: number;
    inProgress: number;
  };
  tasks: { open: number; overdue: number } | null;
  hcps: { total: number } | null;
  trend: { date: string; planned: number; completed: number }[];
  team: { id: string; name: string; planned: number; completed: number }[];
  content: { pending: number; expiring: number } | null;
  training: { assigned: number; completed: number; awaitingReview: number };
  from: string;
  to: string;
  generatedAt: string;
  dataSource: string;
}
export interface AuditEntry {
  id: number;
  occurredAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  correlationId: string;
  actorName: string | null;
  changes: unknown;
  source: string;
}
export interface Notification {
  id: string;
  title: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}
export interface AdminUser {
  organisationUnitId: string | null;
  organisationUnitName: string | null;
  id: string;
  email: string;
  displayName: string;
  status: string;
  managerId: string | null;
  managerName: string | null;
  roles: string[];
  lastLoginAt: string | null;
  timeZone: string;
}
export interface Integration {
  id: string;
  providerKey: string;
  displayName: string;
  isEnabled: boolean;
  environment: string;
  lastCheckedAt: string | null;
  lastErrorCode: string | null;
  adapterAvailable: boolean;
}
export interface AdminUserDetails extends AdminUser {
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  activeSessionCount: number;
  canManage: boolean;
  roleDetails: {
    id: string;
    name: string;
    description: string | null;
    assignedAt: string;
    permissions: string[];
  }[];
  permissions: { key: string; description: string | null }[];
  territories: { id: string; name: string; code: string }[];
  directReports: { id: string; displayName: string; status: string }[];
}
