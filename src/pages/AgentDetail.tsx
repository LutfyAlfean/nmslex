import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Cpu, HardDrive, MemoryStick, Activity, Clock, Wifi } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const agentsData: Record<string, {
  hostname: string; ip: string; os: string; status: string;
  cpu: string; mem: string; disk: string; uptime: string;
}> = {
  "agent-01": { hostname: "web-server-01", ip: "192.168.1.10", os: "Ubuntu 22.04", status: "active", cpu: "23%", mem: "45%", disk: "62%", uptime: "45d 12h" },
  "agent-02": { hostname: "db-server-01", ip: "192.168.1.20", os: "CentOS 9", status: "active", cpu: "67%", mem: "72%", disk: "78%", uptime: "30d 8h" },
  "agent-03": { hostname: "app-server-01", ip: "192.168.1.30", os: "Debian 12", status: "active", cpu: "41%", mem: "58%", disk: "45%", uptime: "22d 3h" },
  "agent-04": { hostname: "firewall-01", ip: "192.168.1.1", os: "pfSense 2.7", status: "active", cpu: "12%", mem: "34%", disk: "28%", uptime: "90d 15h" },
  "agent-05": { hostname: "monitor-vm", ip: "192.168.1.105", os: "Ubuntu 24.04", status: "active", cpu: "55%", mem: "61%", disk: "55%", uptime: "15d 4h" },
};

function generateTimeSeriesData() {
  const data = [];
  for (let i = 0; i < 30; i++) {
    const time = `${String(i).padStart(2, "0")}:00`;
    data.push({
      time,
      cpu: Math.round(20 + Math.random() * 60),
      memory: Math.round(30 + Math.random() * 50),
      disk_read: Math.round(10 + Math.random() * 90),
      disk_write: Math.round(5 + Math.random() * 60),
      net_in: Math.round(100 + Math.random() * 500),
      net_out: Math.round(50 + Math.random() * 300),
    });
  }
  return data;
}

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 10%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "8px",
  color: "hsl(180, 10%, 90%)",
};

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const agent = agentsData[id || ""];
  const data = generateTimeSeriesData();

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Agent not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/agents" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{agent.hostname}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success border border-success/30">
                {agent.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-mono">{agent.ip} • {agent.os} • {id}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "CPU Usage", value: agent.cpu, icon: Cpu, color: "text-primary" },
            { label: "Memory", value: agent.mem, icon: MemoryStick, color: "text-info" },
            { label: "Disk Usage", value: agent.disk, icon: HardDrive, color: "text-warning" },
            { label: "Uptime", value: agent.uptime, icon: Clock, color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* CPU & Memory Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">CPU Usage</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(170, 80%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(170, 80%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="cpu" stroke="hsl(170, 80%, 45%)" fill="url(#cpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MemoryStick className="w-5 h-5 text-info" />
              <h3 className="text-lg font-semibold text-foreground">Memory Usage</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="memory" stroke="hsl(199, 89%, 48%)" fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk & Network Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">Disk I/O</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="drGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} unit=" MB/s" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="disk_read" name="Read" stroke="hsl(38, 92%, 50%)" fill="url(#drGrad)" />
                <Area type="monotone" dataKey="disk_write" name="Write" stroke="hsl(0, 72%, 51%)" fill="url(#dwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="w-5 h-5 text-success" />
              <h3 className="text-lg font-semibold text-foreground">Network Traffic</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="niGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="noGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(280, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} unit=" Kb/s" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="net_in" name="Inbound" stroke="hsl(142, 71%, 45%)" fill="url(#niGrad)" />
                <Area type="monotone" dataKey="net_out" name="Outbound" stroke="hsl(280, 70%, 50%)" fill="url(#noGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-lg font-semibold text-foreground">Top Processes</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {["PID", "Process", "CPU %", "MEM %", "Status"].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { pid: 1234, name: "suricata", cpu: "12.4", mem: "8.2", status: "running" },
                { pid: 2345, name: "filebeat", cpu: "3.1", mem: "4.5", status: "running" },
                { pid: 3456, name: "nginx", cpu: "2.8", mem: "3.1", status: "running" },
                { pid: 4567, name: "node", cpu: "1.5", mem: "6.8", status: "running" },
                { pid: 5678, name: "sshd", cpu: "0.1", mem: "0.8", status: "running" },
              ].map((p) => (
                <tr key={p.pid} className="border-b border-border/30 hover:bg-secondary/50">
                  <td className="p-3 text-sm font-mono text-muted-foreground">{p.pid}</td>
                  <td className="p-3 text-sm font-mono text-foreground">{p.name}</td>
                  <td className="p-3 text-sm text-foreground">{p.cpu}%</td>
                  <td className="p-3 text-sm text-foreground">{p.mem}%</td>
                  <td className="p-3"><span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
