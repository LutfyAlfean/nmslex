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

  const handleExportPDF = () => {
    const printContent = `
<!DOCTYPE html>
<html><head><title>NMSLEX ${period === "weekly" ? "Weekly" : "Monthly"} Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; background: #fff; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #14b8a6; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #0d9488; margin-bottom: 5px; }
  .header p { color: #64748b; font-size: 14px; }
  .header .logo { font-size: 36px; font-weight: 900; color: #0d9488; letter-spacing: 2px; }
  .section { margin-bottom: 25px; }
  .section h2 { font-size: 16px; color: #0d9488; margin-bottom: 10px; border-left: 4px solid #0d9488; padding-left: 10px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
  .stat-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 15px; text-align: center; }
  .stat-card .value { font-size: 24px; font-weight: 700; color: #0d9488; }
  .stat-card .label { font-size: 11px; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #0d9488; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .status-active { color: #16a34a; font-weight: 600; }
  .status-disconnected { color: #dc2626; font-weight: 600; }
  .status-pending { color: #f59e0b; font-weight: 600; }
  .uptime-bar { height: 8px; border-radius: 4px; background: #e2e8f0; }
  .uptime-fill { height: 8px; border-radius: 4px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
  .alert-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .alert-card { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <div class="logo">🐼 NMSLEX</div>
  <h1>Network Management Report</h1>
  <p>${period === "weekly" ? "Weekly" : "Monthly"} Report — Generated: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>
</div>

<div class="stats-grid">
  ${summaryStats.map(s => `<div class="stat-card"><div class="value">${s.value}</div><div class="label">${s.label} (${s.change})</div></div>`).join("")}
</div>

<div class="section">
  <h2>Alert Summary (${period === "weekly" ? "7 Days" : "4 Weeks"})</h2>
  <div class="alert-summary">
    ${period === "weekly" ? `
      <div class="alert-card"><strong>Critical Alerts:</strong> ${weeklyAlerts.reduce((a, b) => a + b.critical, 0)}</div>
      <div class="alert-card"><strong>High Alerts:</strong> ${weeklyAlerts.reduce((a, b) => a + b.high, 0)}</div>
      <div class="alert-card"><strong>Medium Alerts:</strong> ${weeklyAlerts.reduce((a, b) => a + b.medium, 0)}</div>
      <div class="alert-card"><strong>Low Alerts:</strong> ${weeklyAlerts.reduce((a, b) => a + b.low, 0)}</div>
    ` : `
      <div class="alert-card"><strong>Total Inbound:</strong> ${monthlyTraffic.reduce((a, b) => a + b.inbound, 0)} GB</div>
      <div class="alert-card"><strong>Total Outbound:</strong> ${monthlyTraffic.reduce((a, b) => a + b.outbound, 0)} GB</div>
      <div class="alert-card"><strong>Total Blocked:</strong> ${monthlyTraffic.reduce((a, b) => a + b.blocked, 0)}</div>
      <div class="alert-card"><strong>Categories:</strong> ${alertCategories.length} types</div>
    `}
  </div>
</div>

<div class="section">
  <h2>Alert Categories</h2>
  <table>
    <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
    ${alertCategories.map(c => `<tr><td>${c.name}</td><td>${c.value}</td><td>${c.value}%</td></tr>`).join("")}
  </table>
</div>

<div class="section">
  <h2>Agent Performance</h2>
  <table>
    <tr><th>Agent</th><th>Status</th><th>Uptime</th><th>Alerts</th></tr>
    ${agentUptime.map(a => `<tr>
      <td>${a.name}</td>
      <td class="status-${a.status}">${a.status.toUpperCase()}</td>
      <td>${a.uptime}%</td>
      <td>${a.alerts}</td>
    </tr>`).join("")}
  </table>
</div>

<div class="footer">
  <p>© 2026 by Muhammad Lutfi Alfian. All rights reserved.</p>
  <p>NMSLEX — Protecting your network, one packet at a time. 🐼</p>
</div>
</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success("PDF report siap dicetak/disimpan");
    }
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
            <button onClick={() => handleExportPDF()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> Export PDF
            </button>
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
