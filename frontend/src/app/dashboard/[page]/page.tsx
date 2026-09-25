import { WorkspacePage } from "@/components/studio/StudioWorkspace";
const modes = ["products", "studio", "batch", "assets", "social", "notifications", "settings"] as const;
export default async function WorkspaceRoute({ params }: { params: Promise<{ page: string }> }) { const { page } = await params; const mode = modes.includes(page as (typeof modes)[number]) ? page as (typeof modes)[number] : "dashboard"; return <WorkspacePage mode={mode} />; }
