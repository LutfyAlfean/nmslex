import { FileText, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const logs = [
  { ts: "2025-04-05T14:23:01.234Z", level: "ERROR", source: "suricata", host: "nmslex-sensor-01", message: '[Drop] ET EXPLOIT CVE-2024-3094 :: 192.168.1.105 -> 10.0.0.50' },
  { ts: "2025-04-05T14:22:58.102Z", level: "WARN", source: "filebeat", host: "nmslex-agent-03", message: 'Harvester limit reached for /var/log/auth.log' },
  { ts: "2025-04-05T14:22:55.887Z", level: "INFO", source: "elasticsearch", host: "nmslex-es-01", message: '[index:suricata-2025.04.05] 1,247 docs indexed in 1.2s' },
  { ts: "2025-04-05T14:22:50.445Z", level: "INFO", source: "kibana", host: "nmslex-kb-01", message: 'Dashboard "NMSLEX Overview" loaded by admin' },
  { ts: "2025-04-05T14:22:45.332Z", level: "DEBUG", source: "nmslex-manager", host: "nmslex-master", message: 'Agent heartbeat received from agent-05 (192.168.1.105)' },
  { ts: "2025-04-05T14:22:40.118Z", level: "INFO", source: "suricata", host: "nmslex-sensor-01", message: 'Rule reload complete: 45,832 rules loaded' },
  { ts: "2025-04-05T14:22:35.001Z", level: "WARN", source: "elasticsearch", host: "nmslex-es-01", message: 'Disk watermark [high] exceeded on node, shards will be relocated' },
  { ts: "2025-04-05T14:22:30.776Z", level: "INFO", source: "filebeat", host: "nmslex-agent-01", message: 'Connection to Elasticsearch established' },
  { ts: "2025-04-05T14:22:25.554Z", level: "ERROR", source: "nmslex-indexer", host: "nmslex-master", message: 'Index rotation failed: permission denied on /var/lib/nmslex/indices' },
  { ts: "2025-04-05T14:22:20.221Z", level: "INFO", source: "suricata", host: "nmslex-sensor-02", message: 'Stats: packets=1284532 drops=12 alerts=87' },
];

const levelStyles: Record<string, string> = {
  ERROR: "text-destructive bg-destructive/10",
  WARN: "text-warning bg-warning/10",
  INFO: "text-info bg-info/10",
  DEBUG: "text-muted-foreground bg-muted",
};

export default function Logs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Log Explorer
            </h2>
            <p className="text-muted-foreground text-sm">Aggregated logs from Elasticsearch via Filebeat</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 hover:bg-secondary/80 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        <div className="glass rounded-xl p-4 font-mono text-sm space-y-1 max-h-[70vh] overflow-auto">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 py-2 px-3 rounded hover:bg-secondary/50 transition-colors border-b border-border/20">
              <span className="text-muted-foreground text-xs whitespace-nowrap">{log.ts}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${levelStyles[log.level]}`}>{log.level}</span>
              <span className="text-primary text-xs whitespace-nowrap">[{log.source}]</span>
              <span className="text-muted-foreground text-xs whitespace-nowrap">{log.host}</span>
              <span className="text-foreground text-xs">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
