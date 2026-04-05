import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const services = [
  { name: "Suricata IDS/IPS", status: "running", version: "7.0.3", uptime: "15d 4h 23m" },
  { name: "Elasticsearch", status: "running", version: "8.13.0", uptime: "15d 4h 20m" },
  { name: "Kibana", status: "running", version: "8.13.0", uptime: "15d 4h 18m" },
  { name: "Filebeat", status: "running", version: "8.13.0", uptime: "15d 4h 22m" },
  { name: "NMSLEX Manager", status: "running", version: "1.0.0", uptime: "15d 4h 25m" },
  { name: "NMSLEX Indexer", status: "warning", version: "1.0.0", uptime: "2d 1h 05m" },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  running: { icon: CheckCircle, color: "text-success", label: "Running" },
  warning: { icon: AlertTriangle, color: "text-warning", label: "Warning" },
  stopped: { icon: XCircle, color: "text-destructive", label: "Stopped" },
};

export default function ServiceStatus() {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-1">Services Status</h3>
      <p className="text-sm text-muted-foreground mb-4">systemctl integration</p>
      <div className="space-y-3">
        {services.map((service) => {
          const config = statusConfig[service.status];
          const Icon = config.icon;
          return (
            <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">v{service.version}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
                <p className="text-xs text-muted-foreground">{service.uptime}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
