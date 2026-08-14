import { AdminPage } from "@/components/studio/StudioWorkspace";
const modes = ["dashboard", "users", "workspaces", "products", "content", "templates", "generations", "publishing", "analytics", "audit-logs", "settings"] as const;
export default async function AdminRoute({ params }: { params: Promise<{ page: string }> }) { const { page } = await params; const mode = modes.includes(page as (typeof modes)[number]) ? page as (typeof modes)[number] : "dashboard"; return <AdminPage mode={mode} />; }
