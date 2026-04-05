import { Shield, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const allAlerts = [
  { id: 1, severity: "critical", rule: "ET EXPLOIT CVE-2024-3094 XZ Backdoor", sid: 2040001, src: "192.168.1.105:44532", dst: "10.0.0.50:22", proto: "TCP", action: "blocked", time: "2025-04-05 14:23:01" },
  { id: 2, severity: "critical", rule: "ET MALWARE Win32/Emotet C2", sid: 2030445, src: "192.168.1.200:49201", dst: "45.33.32.156:443", proto: "TCP", action: "blocked", time: "2025-04-05 14:18:45" },
  { id: 3, severity: "high", rule: "ET SCAN Nmap SYN Stealth Scan", sid: 2009582, src: "10.0.0.22:0", dst: "10.0.0.1:0", proto: "TCP", action: "alert", time: "2025-04-05 14:15:30" },
  { id: 4, severity: "high", rule: "ET POLICY Outbound SSH connection", sid: 2003068, src: "192.168.1.50:22", dst: "203.0.113.100:54312", proto: "TCP", action: "alert", time: "2025-04-05 14:10:12" },
  { id: 5, severity: "medium", rule: "SSH Brute Force Attempt", sid: 2019876, src: "203.0.113.50:0", dst: "192.168.1.10:22", proto: "TCP", action: "alert", time: "2025-04-05 14:05:55" },
  { id: 6, severity: "medium", rule: "DNS Query for known malicious domain", sid: 2025100, src: "192.168.1.88:53421", dst: "8.8.8.8:53", proto: "UDP", action: "alert", time: "2025-04-05 13:58:20" },
  { id: 7, severity: "low", rule: "Unusual login geo-location", sid: 0, src: "172.16.0.5:0", dst: "192.168.1.1:443", proto: "TCP", action: "info", time: "2025-04-05 13:45:00" },
  { id: 8, severity: "low", rule: "HTTP Request to non-standard port", sid: 2100498, src: "192.168.1.33:50212", dst: "10.0.0.80:8080", proto: "TCP", action: "info", time: "2025-04-05 13:30:44" },
];

const severityStyles: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-info/20 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

const actionStyles: Record<string, string> = {
  blocked: "bg-destructive/20 text-destructive",
  alert: "bg-warning/20 text-warning",
  info: "bg-info/20 text-info",
};

export default function Alerts() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Suricata Alerts
            </h2>
            <p className="text-muted-foreground text-sm">IDS/IPS alerts from Suricata rules engine</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 hover:bg-secondary/80 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Severity", "SID", "Rule", "Source", "Destination", "Proto", "Action", "Timestamp"].map(h => (
                    <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAlerts.map(a => (
                  <tr key={a.id} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium border ${severityStyles[a.severity]}`}>{a.severity}</span></td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">{a.sid || "—"}</td>
                    <td className="p-3 text-sm font-mono text-foreground">{a.rule}</td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">{a.src}</td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">{a.dst}</td>
                    <td className="p-3 text-sm text-foreground">{a.proto}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-medium ${actionStyles[a.action]}`}>{a.action}</span></td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">{a.time}</td>
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
