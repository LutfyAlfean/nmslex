import { Server, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";

const agents = [
  { id: "agent-01", hostname: "web-server-01", ip: "192.168.1.10", os: "Ubuntu 22.04", status: "active", cpu: "23%", mem: "45%", lastSeen: "Just now" },
  { id: "agent-02", hostname: "db-server-01", ip: "192.168.1.20", os: "CentOS 9", status: "active", cpu: "67%", mem: "72%", lastSeen: "Just now" },
  { id: "agent-03", hostname: "app-server-01", ip: "192.168.1.30", os: "Debian 12", status: "active", cpu: "41%", mem: "58%", lastSeen: "Just now" },
  { id: "agent-04", hostname: "firewall-01", ip: "192.168.1.1", os: "pfSense 2.7", status: "active", cpu: "12%", mem: "34%", lastSeen: "Just now" },
  { id: "agent-05", hostname: "monitor-vm", ip: "192.168.1.105", os: "Ubuntu 24.04", status: "active", cpu: "55%", mem: "61%", lastSeen: "2 min ago" },
  { id: "agent-06", hostname: "backup-server", ip: "192.168.1.50", os: "Rocky Linux 9", status: "disconnected", cpu: "—", mem: "—", lastSeen: "2 hours ago" },
  { id: "agent-07", hostname: "dev-vm-01", ip: "192.168.1.100", os: "Ubuntu 22.04", status: "pending", cpu: "—", mem: "—", lastSeen: "Never" },
];

const statusConfig: Record<string, { dot: string; text: string }> = {
  active: { dot: "bg-success", text: "text-success" },
  disconnected: { dot: "bg-destructive", text: "text-destructive" },
  pending: { dot: "bg-warning", text: "text-warning" },
};

export default function Agents() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Server className="w-6 h-6 text-primary" /> NMSLEX Agents
            </h2>
            <p className="text-muted-foreground text-sm">Manage monitored hosts and VMs</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg text-sm text-foreground border border-border/30 hover:bg-secondary transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary rounded-lg text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Agent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const sc = statusConfig[agent.status];
            const isClickable = agent.status === "active";
            const Card = isClickable ? Link : "div";
            const cardProps = isClickable ? { to: `/agents/${agent.id}` } : {};
            return (
              <Card
                key={agent.id}
                {...(cardProps as any)}
                className={`glass rounded-xl p-5 space-y-3 transition-all ${
                  isClickable ? "hover:border-primary/30 cursor-pointer hover:bg-card/80" : "opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${sc.dot} ${agent.status === 'active' ? 'animate-pulse-glow' : ''}`} />
                    <span className={`text-xs font-medium ${sc.text} capitalize`}>{agent.status}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">{agent.id}</span>
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">{agent.hostname}</p>
                  <p className="text-xs text-muted-foreground font-mono">{agent.ip}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{agent.os}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/40 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">CPU</p>
                    <p className="text-sm font-semibold text-foreground">{agent.cpu}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">MEM</p>
                    <p className="text-sm font-semibold text-foreground">{agent.mem}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Last seen: {agent.lastSeen}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
