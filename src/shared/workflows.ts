export type Workflow = {
  path: string;
  title: string;
  permission: string;
  steps: { text: string; permission?: string }[];
};

export const workflows: Workflow[] = [
  {
    path: "/messages",
    title: "Messages",
    permission: "chat.use",
    steps: [
      {
        text: "Choose New conversation to contact your assigned medical representative or linked HCP. An administrator first links the HCP login account in their directory profile.",
      },
      {
        text: "Send a text message, filter unread chats, or load earlier messages. Chats refresh automatically. One tick means sent; two blue ticks mean read.",
      },
      {
        text: "Both participants need active accounts and messaging permission. Contact permission must be enabled to send. Managers and administrators cannot read other people's chats through their broader record scope.",
      },
    ],
  },
  {
    path: "/hcps",
    title: "Healthcare professionals (HCPs)",
    permission: "hcp.read",
    steps: [
      {
        text: "Search the directory and open a contact to review their institution, ownership and contact permission.",
      },
      {
        text: "Add or edit an HCP. Choose an eligible owner first, then one of that person's territories. Record contact permission before planning a visit.",
        permission: "hcp.write",
      },
      {
        text: "Review suspected duplicates before merging. The surviving contact keeps linked visits and tasks.",
        permission: "hcp.merge",
      },
    ],
  },
  {
    path: "/engagements",
    title: "Visit planning and reporting",
    permission: "engagement.read",
    steps: [
      {
        text: "Check the date range and status filter to find upcoming or completed visits.",
      },
      {
        text: "Schedule a visit: select an HCP with contact permission, choose an eligible representative and a free time slot.",
        permission: "engagement.write",
      },
      {
        text: "Start the visit within 15 minutes of its scheduled start or later. While in progress, submit a call report with actual times, outcome and any follow-up. Submission completes the visit.",
        permission: "engagement.write",
      },
      {
        text: "Use reschedule or cancel with a reason when plans change. Open Call reports to read submitted records.",
        permission: "engagement.write",
      },
    ],
  },
  {
    path: "/call-reports",
    title: "Call reports",
    permission: "engagement.read",
    steps: [
      {
        text: "Filter reports by review status. Open a report to review its outcome, materials and follow-up.",
      },
      {
        text: "Submit new reports from an in-progress visit in Visit planner.",
        permission: "engagement.write",
      },
      {
        text: "Review another person's submitted report and approve or reject it with comments.",
        permission: "engagement.manage",
      },
      {
        text: "Correct your own rejected report with a reason and resubmit it. Earlier values remain in the amendment history.",
        permission: "engagement.write",
      },
    ],
  },
  {
    path: "/tasks",
    title: "Follow-up tasks",
    permission: "task.read",
    steps: [
      {
        text: "Use status filters to find open, in-progress, overdue or completed work.",
      },
      {
        text: "Create a clear action with a future due date. Linking an HCP restricts assignees to people who can access that contact.",
        permission: "task.write",
      },
      {
        text: "Start, complete or cancel a task and record a reason. The tick control completes the task.",
        permission: "task.write",
      },
    ],
  },
  {
    path: "/content",
    title: "Controlled content",
    permission: "content.read",
    steps: [
      {
        text: "Search published documents and download the current, effective PDF.",
      },
      {
        text: "Upload a PDF as a draft, then submit it for independent review. After approval, publish it with an effective date and expiry.",
        permission: "content.write",
      },
      {
        text: "Start review, check the document and approve or reject with comments. Authors cannot approve their own material.",
        permission: "content.review",
      },
      {
        text: "Upload a new version when content changes. Retired, expired or superseded material cannot be used for new learning or visits.",
        permission: "content.write",
      },
    ],
  },
  {
    path: "/training",
    title: "Learning and training",
    permission: "training.read",
    steps: [
      {
        text: "In Training assignments, read the learning material, then start the assignment. Complete any required simulation before submitting the assessment.",
      },
      {
        text: "A failed assessment can be retried while attempts remain. Every pass awaits an independent manager review; check the assignment status.",
      },
      {
        text: "In Course library, create a course, submit it for independent review and publish after approval. Assign a published course with current material to an eligible learner and set a future due date.",
        permission: "training.manage",
      },
      {
        text: "Review passed assignments in your scope when manager review is required. You cannot review your own assessment.",
        permission: "training.manage",
      },
      {
        text: "Review submitted courses independently before they can be published.",
        permission: "content.review",
      },
    ],
  },
  {
    path: "/analytics",
    title: "Analytics and overview",
    permission: "reports.read",
    steps: [
      {
        text: "Choose a date range and review recorded activity within your access scope. Modules without read permission are shown as unavailable.",
      },
      {
        text: "Export the selected engagement date range to CSV for further analysis.",
        permission: "engagement.manage",
      },
    ],
  },
  {
    path: "/compliance",
    title: "Audit trail",
    permission: "audit.read",
    steps: [
      {
        text: "Filter by action or record type, then open an event to inspect its actor, time, correlation ID and recorded changes.",
      },
      {
        text: "Events are append-only. Your access scope determines which actors' events you can see.",
      },
    ],
  },
  {
    path: "/admin",
    title: "People and access",
    permission: "admin.manage",
    steps: [
      {
        text: "Create an account with a role, reporting manager and organisation unit. Only grant permissions you already hold.",
      },
      {
        text: "Click a person's name to see their profile, roles, effective permissions, territories and session count.",
      },
      {
        text: "Edit their profile or manage access with a reason. Deactivate to block sign-in; reactivate when access is needed again. Profile and access changes end existing sessions.",
      },
      {
        text: "Use Add territory for eligible field staff. CSV import validates every row before saving the batch.",
      },
    ],
  },
  {
    path: "/organisation",
    title: "Organisation and roles",
    permission: "admin.manage",
    steps: [
      {
        text: "Set organisation branding and defaults. Create units to describe the organisation structure.",
      },
      {
        text: "Create custom roles with the minimum required permissions. Read and write permissions work together; add a team or organisation scope only when needed.",
      },
      {
        text: "Changing role permissions ends affected sessions. Users sign in again to see their updated navigation and actions.",
      },
    ],
  },
  {
    path: "/integrations",
    title: "Integrations",
    permission: "integrations.read",
    steps: [
      {
        text: "Inspect configured providers, synchronization runs and webhook results. Provider setup requires backend configuration; this page reports connection activity.",
      },
    ],
  },
];

export function scopeDescription(permissions: string[]) {
  return permissions.includes("scope.organisation")
    ? "Organisation scope: permitted record types across the organisation. A scope does not grant access to a module by itself."
    : permissions.includes("scope.team")
      ? "Team scope: your records and those of your direct reports. This does not include every descendant in the reporting hierarchy."
      : "Personal scope: records assigned to you. Published content and course visibility follow their own access rules.";
}
