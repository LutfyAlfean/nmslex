import { useState } from "react";
import { Globe, Server, Wifi, Shield, AlertTriangle, CheckCircle, XCircle, ZoomIn, ZoomOut } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface TopoNode {
  id: string;
  label: string;
  type: "master" | "agent" | "service";
  status: "active" | "warning" | "disconnected" | "pending";
  ip: string;
  x: number;
  y: number;
  info?: string;
}

interface TopoLink {
  from: string;
  to: string;
  status: "active" | "degraded" | "down";
  label?: string;
}

const nodes: TopoNode[] = [
  // Master
  { id: "master", label: "NMSLEX Master", type: "master", status: "active", ip: "192.168.1.100", x: 400, y: 80, info: "Dashboard + Suricata + ES + Kibana" },
  // Services
  { id: "suricata", label: "Suricata", type: "service", status: "active", ip: ":8443", x: 200, y: 200, info: "IDS/IPS Engine" },
  { id: "elasticsearch", label: "Elasticsearch", type: "service", status: "active", ip: ":9200", x: 400, y: 200, info: "Search & Analytics" },
  { id: "kibana", label: "Kibana", type: "service", status: "active", ip: ":5601", x: 600, y: 200, info: "Visualization" },
  // Agents
  { id: "agent-01", label: "web-server-01", type: "agent", status: "active", ip: "192.168.1.10", x: 100, y: 380 },
  { id: "agent-02", label: "db-server-01", type: "agent", status: "active", ip: "192.168.1.20", x: 250, y: 380 },
  { id: "agent-03", label: "app-server-01", type: "agent", status: "active", ip: "192.168.1.30", x: 400, y: 380 },
  { id: "agent-04", label: "firewall-01", type: "agent", status: "active", ip: "192.168.1.1", x: 550, y: 380 },
  { id: "agent-05", label: "monitor-vm", type: "agent", status: "active", ip: "192.168.1.105", x: 700, y: 380 },
  { id: "agent-06", label: "backup-server", type: "agent", status: "disconnected", ip: "192.168.1.50", x: 175, y: 500 },
  { id: "agent-07", label: "dev-vm-01", type: "agent", status: "pending", ip: "192.168.1.100", x: 625, y: 500 },
];

const links: TopoLink[] = [
  // Master ↔ Services
  { from: "master", to: "suricata", status: "active", label: "eve.json" },
  { from: "master", to: "elasticsearch", status: "active", label: "API" },
  { from: "master", to: "kibana", status: "active", label: "HTTP" },
  { from: "suricata", to: "elasticsearch", status: "active", label: "Filebeat" },
  // Agents ↔ Elasticsearch (via Filebeat)
  { from: "agent-01", to: "elasticsearch", status: "active" },
  { from: "agent-02", to: "elasticsearch", status: "active" },
  { from: "agent-03", to: "elasticsearch", status: "active" },
  { from: "agent-04", to: "elasticsearch", status: "active" },
  { from: "agent-05", to: "elasticsearch", status: "active" },
  { from: "agent-06", to: "elasticsearch", status: "down" },
  { from: "agent-07", to: "elasticsearch", status: "degraded" },
  // Agents ↔ Suricata monitoring
  { from: "agent-01", to: "suricata", status: "active" },
  { from: "agent-02", to: "suricata", status: "active" },
  { from: "agent-03", to: "suricata", status: "active" },
  { from: "agent-04", to: "suricata", status: "active" },
  { from: "agent-05", to: "suricata", status: "active" },
];

const statusColors = {
  active: { stroke: "hsl(170, 80%, 45%)", fill: "hsl(170, 80%, 45%)", bg: "rgba(20, 184, 166, 0.1)" },
  warning: { stroke: "hsl(38, 92%, 50%)", fill: "hsl(38, 92%, 50%)", bg: "rgba(245, 158, 11, 0.1)" },
  disconnected: { stroke: "hsl(0, 72%, 51%)", fill: "hsl(0, 72%, 51%)", bg: "rgba(239, 68, 68, 0.1)" },
  pending: { stroke: "hsl(38, 92%, 50%)", fill: "hsl(38, 92%, 50%)", bg: "rgba(245, 158, 11, 0.1)" },
};

const linkColors = {
  active: "hsl(170, 80%, 45%)",
  degraded: "hsl(38, 92%, 50%)",
  down: "hsl(0, 72%, 51%)",
};

const typeIcons: Record<string, string> = {
  master: "🐼",
  service: "⚙️",
  agent: "🖥️",
};

function getNodePos(id: string) {
  const n = nodes.find((n) => n.id === id);
  return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
}

export default function Topology() {
  const [selected, setSelected] = useState<TopoNode | null>(null);
  const [zoom, setZoom] = useState(1);

  const svgW = 800;
  const svgH = 580;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" /> Network Topology
            </h2>
            <p className="text-muted-foreground text-sm">Visualisasi koneksi antar agent dan server NMSLEX</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.min(z + 0.15, 2))} className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))} className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground ml-2">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {[
            { color: "bg-success", label: "Active" },
            { color: "bg-warning", label: "Warning / Pending" },
            { color: "bg-destructive", label: "Disconnected" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-[11px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-4">
            <span className="text-[11px]">🐼</span><span className="text-[11px] text-muted-foreground">Master</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">⚙️</span><span className="text-[11px] text-muted-foreground">Service</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">🖥️</span><span className="text-[11px] text-muted-foreground">Agent</span>
          </div>
        </div>

        <div className="flex gap-5">
          {/* SVG Map */}
          <div className="flex-1 glass rounded-xl overflow-hidden" style={{ minHeight: 500 }}>
            <div className="w-full h-full overflow-auto p-2">
              <svg
                width={svgW * zoom}
                height={svgH * zoom}
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="mx-auto"
              >
                {/* Grid pattern */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220, 15%, 14%)" strokeWidth="0.5" />
                  </pattern>
                  {/* Glow filter */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Animated dash */}
                  <style>{`
                    @keyframes dash-flow {
                      to { stroke-dashoffset: -20; }
                    }
                    .link-active {
                      animation: dash-flow 1s linear infinite;
                    }
                  `}</style>
                </defs>
                <rect width={svgW} height={svgH} fill="url(#grid)" rx="8" />

                {/* Links */}
                {links.map((link, i) => {
                  const from = getNodePos(link.from);
                  const to = getNodePos(link.to);
                  const color = linkColors[link.status];
                  const opacity = link.status === "down" ? 0.3 : link.status === "degraded" ? 0.5 : 0.4;
                  return (
                    <g key={i}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={color}
                        strokeWidth={link.status === "active" ? 1.5 : 1}
                        opacity={opacity}
                        strokeDasharray={link.status === "down" ? "4 4" : link.status === "degraded" ? "6 3" : "5 5"}
                        className={link.status === "active" ? "link-active" : ""}
                      />
                      {link.label && (
                        <text
                          x={(from.x + to.x) / 2}
                          y={(from.y + to.y) / 2 - 6}
                          textAnchor="middle"
                          fill="hsl(220, 10%, 50%)"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {link.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const sc = statusColors[node.status];
                  const isSelected = selected?.id === node.id;
                  const size = node.type === "master" ? 36 : node.type === "service" ? 28 : 24;
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelected(node)}
                      className="cursor-pointer"
                      filter={isSelected ? "url(#glow)" : undefined}
                    >
                      {/* Pulse ring for active */}
                      {node.status === "active" && (
                        <circle cx={node.x} cy={node.y} r={size + 6} fill="none" stroke={sc.stroke} strokeWidth="0.5" opacity="0.3">
                          <animate attributeName="r" from={String(size + 2)} to={String(size + 10)} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* Node background */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={size}
                        fill={sc.bg}
                        stroke={isSelected ? sc.stroke : sc.stroke}
                        strokeWidth={isSelected ? 2.5 : 1}
                        opacity={node.status === "disconnected" ? 0.5 : 1}
                      />
                      {/* Icon */}
                      <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={node.type === "master" ? 18 : 14}>
                        {typeIcons[node.type]}
                      </text>
                      {/* Label */}
                      <text x={node.x} y={node.y + size + 14} textAnchor="middle" fill="hsl(180, 10%, 85%)" fontSize="10" fontWeight="500">
                        {node.label}
                      </text>
                      <text x={node.x} y={node.y + size + 25} textAnchor="middle" fill="hsl(220, 10%, 50%)" fontSize="8" fontFamily="monospace">
                        {node.ip}
                      </text>
                      {/* Status dot */}
                      <circle cx={node.x + size - 4} cy={node.y - size + 4} r="4" fill={sc.fill} stroke="hsl(220, 20%, 7%)" strokeWidth="1.5" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Selected Node */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {selected ? "Node Detail" : "Select a node"}
              </h3>
              {selected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeIcons[selected.type]}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selected.label}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{selected.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected.status === "active" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : selected.status === "disconnected" ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    <span className={`text-xs capitalize font-medium ${
                      selected.status === "active" ? "text-success" : selected.status === "disconnected" ? "text-destructive" : "text-warning"
                    }`}>
                      {selected.status}
                    </span>
                  </div>
                  {selected.info && <p className="text-[11px] text-muted-foreground">{selected.info}</p>}
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Connections</p>
                    {links
                      .filter((l) => l.from === selected.id || l.to === selected.id)
                      .map((l, i) => {
                        const peer = l.from === selected.id ? l.to : l.from;
                        const peerNode = nodes.find((n) => n.id === peer);
                        return (
                          <div key={i} className="flex items-center gap-2 py-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${l.status === "active" ? "bg-success" : l.status === "degraded" ? "bg-warning" : "bg-destructive"}`} />
                            <span className="text-[11px] text-foreground">{peerNode?.label}</span>
                            {l.label && <span className="text-[10px] text-muted-foreground ml-auto">{l.label}</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Klik node di peta untuk melihat detail koneksi.</p>
              )}
            </div>

            {/* Stats */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Network Stats</h3>
              <div className="space-y-2">
                {[
                  { label: "Total Nodes", value: nodes.length, icon: Server },
                  { label: "Active Links", value: links.filter((l) => l.status === "active").length, icon: Wifi },
                  { label: "Down Links", value: links.filter((l) => l.status === "down").length, icon: AlertTriangle },
                  { label: "Agents Online", value: nodes.filter((n) => n.type === "agent" && n.status === "active").length, icon: Shield },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground font-mono">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
