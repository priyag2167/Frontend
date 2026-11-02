import {
  Activity,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCheck,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  Cable,
  MessageCircle,
} from "lucide-react";

export const navigation = [
  {
    to: "/",
    label: "Overview",
    icon: LayoutDashboard,
    permission: "reports.read",
    end: true,
  },
  {
    to: "/hcps",
    label: "HCP directory",
    icon: Stethoscope,
    permission: "hcp.read",
  },
  {
    to: "/messages",
    label: "Messages",
    icon: MessageCircle,
    permission: "chat.use",
  },
  {
    to: "/engagements",
    label: "Visit planner",
    icon: CalendarDays,
    permission: "engagement.read",
  },
  {
    to: "/call-reports",
    label: "Call reports",
    icon: ClipboardList,
    permission: "engagement.read",
  },
  {
    to: "/tasks",
    label: "Follow-up tasks",
    icon: CheckCheck,
    permission: "task.read",
  },
  {
    to: "/content",
    label: "Content library",
    icon: BookOpen,
    permission: "content.read",
  },
  {
    to: "/training",
    label: "Learning & training",
    icon: Activity,
    permission: "training.read",
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: ChartNoAxesCombined,
    permission: "reports.read",
  },
  {
    to: "/compliance",
    label: "Audit trail",
    icon: ShieldCheck,
    permission: "audit.read",
  },
  {
    to: "/integrations",
    label: "Integrations",
    icon: Cable,
    permission: "integrations.read",
  },
  {
    to: "/organisation",
    label: "Organisation & roles",
    icon: Settings,
    permission: "admin.manage",
  },
  {
    to: "/admin",
    label: "People & access",
    icon: Users,
    permission: "admin.manage",
  },
];

export function getPageTitle(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/login") return "Sign in";
  if (path === "/settings") return "My settings";
  if (path === "/guide") return "Workflow guide";
  if (path.startsWith("/admin/users/")) return "User details";
  return navigation.find((item) => item.to === path)?.label ?? "Page not found";
}
