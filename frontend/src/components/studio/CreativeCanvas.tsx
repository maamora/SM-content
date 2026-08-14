/* STUDIO Editorial Creative OS: a dark visual field where prompts, media, and decisions stay connected. */
"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import {
  Check,
  ChevronRight,
  CircleDashed,
  FileImage,
  Film,
  Maximize2,
  MoreHorizontal,
  Palette,
  Play,
  Plus,
  Search,
  Sparkles,
  WandSparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type CanvasNodeKind = "prompt" | "image" | "video" | "palette" | "empty";

export interface CanvasNode {
  id: string;
  kind: CanvasNodeKind;
  label: string;
  title: string;
  meta: string;
  detail?: string;
  imageUrl?: string;
  x: number;
  y: number;
  status?: "ready" | "draft" | "live";
}

interface CreativeCanvasProps {
  nodes: CanvasNode[];
  title?: string;
  eyebrow?: string;
  compact?: boolean;
  showInspector?: boolean;
}

const kindIcon = {
  prompt: WandSparkles,
  image: FileImage,
  video: Film,
  palette: Palette,
  empty: Plus,
} as const;

function NodePreview({ node }: { node: CanvasNode }) {
  const Icon = kindIcon[node.kind];
  if (node.imageUrl) {
    return <Image src={node.imageUrl} alt="" fill sizes="220px" className="studio-canvas-node__image" unoptimized />;
  }
  return <div className={`studio-canvas-node__art studio-canvas-node__art--${node.kind}`}><Icon size={node.kind === "empty" ? 18 : 15} /></div>;
}

export function CreativeCanvas({ nodes, title = "Creative thread", eyebrow = "CANVAS / LIVE", compact = false, showInspector = true }: CreativeCanvasProps) {
  const [activeId, setActiveId] = useState(nodes[0]?.id ?? "");
  const [zoom, setZoom] = useState(100);
  const [queued, setQueued] = useState(false);
  const active = nodes.find((node) => node.id === activeId) ?? nodes[0];
  const activeIndex = Math.max(0, nodes.findIndex((node) => node.id === active?.id));
  const activeKind = active?.kind ?? "prompt";
  const ActiveIcon = kindIcon[activeKind];
  const linePoints = useMemo(() => {
    const ordered = [...nodes].sort((a, b) => a.x - b.x);
    return ordered.slice(0, -1).map((node, index) => {
      const next = ordered[index + 1];
      return `M ${node.x} ${node.y + 4} C ${node.x + 8} ${node.y - 7}, ${next.x - 8} ${next.y + 15}, ${next.x} ${next.y + 4}`;
    });
  }, [nodes]);

  const selectNext = () => {
    if (!nodes.length) return;
    setActiveId(nodes[(activeIndex + 1) % nodes.length].id);
  };

  return (
    <section className={`studio-canvas ${compact ? "studio-canvas--compact" : ""}`} aria-label={title}>
      <div className="studio-canvas__topbar">
        <div className="studio-canvas__title"><span className="studio-canvas__live"><CircleDashed size={13} /> {eyebrow}</span><strong>{title}</strong></div>
        <div className="studio-canvas__controls"><button type="button" aria-label="Search canvas"><Search size={14} /></button><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(70, value - 10))}><ZoomOut size={14} /></button><span>{zoom}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(130, value + 10))}><ZoomIn size={14} /></button><button type="button" aria-label="Fit canvas"><Maximize2 size={14} /></button></div>
      </div>

      <div className="studio-canvas__body">
        <div className="studio-canvas__field" style={{ "--canvas-zoom": `${zoom / 100}` } as CSSProperties}>
          <div className="studio-canvas__grid" aria-hidden="true" />
          <svg className="studio-canvas__threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {linePoints.map((path, index) => <path key={`${path}-${index}`} d={path} />)}
          </svg>
          {nodes.map((node) => {
            const Icon = kindIcon[node.kind];
            const isActive = active?.id === node.id;
            const nodeStyle = { "--node-x": `${node.x}%`, "--node-y": `${node.y}%` } as CSSProperties;
            return <button type="button" key={node.id} className={`studio-canvas-node studio-canvas-node--${node.kind} ${isActive ? "is-active" : ""}`} style={nodeStyle} onClick={() => setActiveId(node.id)} aria-pressed={isActive}>
              <div className="studio-canvas-node__head"><span><Icon size={12} /> {node.label}</span><MoreHorizontal size={13} /></div>
              <div className="studio-canvas-node__media"><NodePreview node={node} />{node.kind === "video" && <span className="studio-canvas-node__play"><Play size={11} fill="currentColor" /></span>}</div>
              <div className="studio-canvas-node__copy"><strong>{node.title}</strong><small>{node.meta}</small></div>
              <span className={`studio-canvas-node__status studio-canvas-node__status--${node.status ?? "draft"}`}><i />{node.status ?? "draft"}</span>
            </button>;
          })}
          <div className="studio-canvas__cursor" aria-hidden="true"><span>you</span></div>
        </div>

        {showInspector && active && <aside className="studio-canvas__inspector"><div className="studio-canvas__inspector-head"><span className="studio-kicker">INSPECTOR</span><button type="button" aria-label="Close inspector"><ChevronRight size={15} /></button></div><div className="studio-canvas__inspector-icon"><ActiveIcon size={17} /></div><h3>{active.title}</h3><p>{active.detail ?? "A live creative object with its context attached."}</p><label>Node type<span>{active.label}</span></label><label>Thread state<span className="is-lime">{queued ? "Queued for next branch" : active.status ?? "Draft"}</span></label><button type="button" className="studio-canvas__inspector-action" onClick={() => setQueued(true)}><Sparkles size={14} /> {queued ? "Branch queued" : "Generate a branch"}</button></aside>}
      </div>

      <div className="studio-canvas__bottom"><div className="studio-canvas__minimap"><span className="studio-canvas__minimap-grid" /><i /><i /><i /><b /></div><div className="studio-canvas__tray"><button type="button" className="is-active"><WandSparkles size={14} /> Prompt</button><button type="button"><FileImage size={14} /> Image</button><button type="button"><Film size={14} /> Video</button><button type="button"><Plus size={14} /> Add</button></div><button type="button" className="studio-canvas__next" onClick={selectNext}><Check size={14} /> Next signal</button></div>
    </section>
  );
}
