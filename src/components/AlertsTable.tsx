const alerts = [
  { id: 1, severity: "critical", source: "Suricata", message: "ET EXPLOIT Possible CVE-2024-3094 XZ Backdoor", src_ip: "192.168.1.105", dest_ip: "10.0.0.50", time: "2 min ago" },
  { id: 2, severity: "high", source: "Suricata", message: "ET SCAN Nmap -sS Stealth Scan Detected", src_ip: "10.0.0.22", dest_ip: "10.0.0.1", time: "5 min ago" },
  { id: 3, severity: "medium", source: "Filebeat", message: "SSH brute force attempt detected", src_ip: "203.0.113.50", dest_ip: "192.168.1.10", time: "12 min ago" },
  { id: 4, severity: "low", source: "Elasticsearch", message: "Unusual login pattern from new geo-location", src_ip: "172.16.0.5", dest_ip: "192.168.1.1", time: "18 min ago" },
  { id: 5, severity: "critical", source: "Suricata", message: "ET MALWARE Win32/Emotet Activity Detected", src_ip: "192.168.1.200", dest_ip: "45.33.32.156", time: "25 min ago" },
];

const severityStyles: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-info/20 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function AlertsTable() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
        <p className="text-sm text-muted-foreground">Powered by Suricata IDS/IPS</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Severity</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Source</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Message</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Src IP</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Dest IP</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id} className="border-b border-border/30 hover:bg-secondary/50 transition-colors">
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${severityStyles[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="p-3 text-sm text-foreground">{alert.source}</td>
                <td className="p-3 text-sm text-foreground font-mono text-xs">{alert.message}</td>
                <td className="p-3 text-sm font-mono text-muted-foreground">{alert.src_ip}</td>
                <td className="p-3 text-sm font-mono text-muted-foreground">{alert.dest_ip}</td>
                <td className="p-3 text-sm text-muted-foreground">{alert.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
