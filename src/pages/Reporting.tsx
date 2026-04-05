import { useState } from "react";
import { FileText, Download, Calendar, Shield, Activity, Server, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, FileDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

const weeklyAlerts = [
  { day: "Sen", critical: 3, high: 8, medium: 15, low: 22 },
  { day: "Sel", critical: 1, high: 5, medium: 12, low: 18 },
  { day: "Rab", critical: 5, high: 12, medium: 20, low: 25 },
  { day: "Kam", critical: 2, high: 7, medium: 10, low: 15 },
  { day: "Jum", critical: 4, high: 9, medium: 18, low: 20 },
  { day: "Sab", critical: 1, high: 3, medium: 8, low: 10 },
  { day: "Min", critical: 0, high: 2, medium: 5, low: 8 },
];

const monthlyTraffic = [
  { week: "W1", inbound: 245, outbound: 180, blocked: 32 },
  { week: "W2", inbound: 310, outbound: 220, blocked: 45 },
  { week: "W3", inbound: 280, outbound: 195, blocked: 28 },
  { week: "W4", inbound: 350, outbound: 260, blocked: 52 },
];

const alertCategories = [
  { name: "Intrusion", value: 35, color: "hsl(0, 72%, 51%)" },
  { name: "Malware", value: 20, color: "hsl(38, 92%, 50%)" },
  { name: "Policy", value: 25, color: "hsl(170, 80%, 45%)" },
  { name: "Anomaly", value: 15, color: "hsl(220, 70%, 55%)" },
  { name: "Other", value: 5, color: "hsl(280, 60%, 50%)" },
];

const agentUptime = [
  { name: "web-server-01", uptime: 99.9, alerts: 12, status: "active" },
  { name: "db-server-01", uptime: 99.7, alerts: 8, status: "active" },
  { name: "app-server-01", uptime: 98.5, alerts: 24, status: "active" },
  { name: "firewall-01", uptime: 99.99, alerts: 45, status: "active" },
  { name: "monitor-vm", uptime: 99.8, alerts: 5, status: "active" },
  { name: "backup-server", uptime: 85.2, alerts: 3, status: "disconnected" },
  { name: "dev-vm-01", uptime: 92.1, alerts: 1, status: "pending" },
];

const summaryStats = [
  { label: "Total Alerts", value: "1,247", change: "+12%", trend: "up", icon: Shield },
  { label: "Blocked Threats", value: "157", change: "+8%", trend: "up", icon: AlertTriangle },
  { label: "Avg Response Time", value: "1.2s", change: "-15%", trend: "down", icon: Activity },
  { label: "Agent Uptime", value: "96.4%", change: "+0.3%", trend: "up", icon: Server },
];

export default function Reporting() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const handleExport = (format: string) => {
    const data = period === "weekly"
      ? JSON.stringify({ period: "Weekly Report", alerts: weeklyAlerts, agents: agentUptime, categories: alertCategories }, null, 2)
      : JSON.stringify({ period: "Monthly Report", traffic: monthlyTraffic, agents: agentUptime, categories: alertCategories }, null, 2);

    const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nmslex-report-${period}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Reporting
            </h2>
            <p className="text-muted-foreground text-sm">Laporan mingguan & bulanan tentang alerts dan aktivitas jaringan</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport("json")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button onClick={() => handleExport("csv")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-foreground text-xs font-medium hover:bg-secondary transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryStats.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <span className={`text-[10px] font-medium flex items-center gap-0.5 ${stat.trend === "up" && stat.label !== "Avg Response Time" ? "text-success" : stat.trend === "down" && stat.label === "Avg Response Time" ? "text-success" : "text-warning"}`}>
                  {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
          <TabsList>
            <TabsTrigger value="weekly" className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Mingguan
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Bulanan
            </TabsTrigger>
          </TabsList>

          {/* Weekly */}
          <TabsContent value="weekly">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
              {/* Alert Trend */}
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Alert Trend (7 Hari)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={weeklyAlerts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="day" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 20%, 10%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="critical" stackId="1" stroke="hsl(0, 72%, 51%)" fill="hsl(0, 72%, 51%)" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="high" stackId="1" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="medium" stackId="1" stroke="hsl(170, 80%, 45%)" fill="hsl(170, 80%, 45%)" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="low" stackId="1" stroke="hsl(220, 70%, 55%)" fill="hsl(220, 70%, 55%)" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Alert Categories */}
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Alert Categories</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={alertCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {alertCategories.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 20%, 10%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Monthly */}
          <TabsContent value="monthly">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Network Traffic (4 Minggu)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyTraffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="week" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 20%, 10%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="inbound" fill="hsl(170, 80%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outbound" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="blocked" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Alert Categories</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={alertCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {alertCategories.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 20%, 10%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Agent Uptime Table */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Agent Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Agent</th>
                  <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Status</th>
                  <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Uptime</th>
                  <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Alerts</th>
                  <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Health</th>
                </tr>
              </thead>
              <tbody>
                {agentUptime.map((agent) => (
                  <tr key={agent.name} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 px-3 text-foreground font-mono text-xs">{agent.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${agent.status === "active" ? "text-success" : agent.status === "disconnected" ? "text-destructive" : "text-warning"}`}>
                        {agent.status === "active" ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{agent.uptime}%</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{agent.alerts}</td>
                    <td className="py-2.5 px-3">
                      <div className="w-full bg-secondary/50 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${agent.uptime >= 99 ? "bg-success" : agent.uptime >= 95 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${agent.uptime}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
