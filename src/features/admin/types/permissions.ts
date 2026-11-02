export const permissionDescriptions: Record<string, string> = {
  "chat.use":
    "Message as the assigned medical representative or linked HCP. Does not grant access to other people's conversations.",
  "hcp.read": "View healthcare contacts within the user's record scope.",
  "hcp.write": "Create and update healthcare contacts within scope.",
  "hcp.export": "Export healthcare contact records.",
  "hcp.merge": "Merge duplicate healthcare contacts.",
  "engagement.read": "View visits and call reports within scope.",
  "engagement.write": "Plan visits and record interactions within scope.",
  "engagement.manage": "Manage team engagements and review call reports.",
  "task.read": "View follow-up tasks within scope.",
  "task.write": "Create and update follow-up tasks within scope.",
  "content.read": "View available content and download published material.",
  "content.write": "Upload and manage controlled content.",
  "content.review": "Independently review content and course submissions.",
  "training.read": "Access assigned learning and assessments.",
  "training.manage":
    "Manage courses, assignments and training reviews within scope.",
  "audit.read": "View audit evidence within scope.",
  "reports.read": "View dashboards and reports within scope.",
  "admin.manage":
    "Manage organisation settings, users, roles and account access.",
  "integrations.read": "View integration connections and their status.",
  "scope.team":
    "Include records owned by the user's direct reports where supported.",
  "scope.organisation":
    "Include records across the organisation where supported.",
};
