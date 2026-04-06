import { CheckCircle, AlertTriangle, XCircle, HelpCircle, RefreshCw, Loader2 } from "lucide-react";
import { useHealthCheck } from "@/hooks/useHealthCheck";

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  running: { icon: CheckCircle, color: "text-success", label: "Running" },
  warning: { icon: AlertTriangle, color: "text-warning", label: "Warning" },
  stopped: { icon: XCircle, color: "text-destructive", label: "Stopped" },
  unknown: { icon: HelpCircle, color: "text-muted-foreground", label: "Unknown" },
};

export default function ServiceStatus() {
  const { health, loading, refresh } = useHealthCheck(60000);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-foreground">Services Status</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {health ? (
          <span className={health.overall === "healthy" ? "text-success" : health.overall === "degraded" ? "text-destructive" : "text-warning"}>
            {health.overall === "healthy" ? "All systems operational" : health.overall === "degraded" ? "Service degradation detected" : "Partial availability"}
          </span>
        ) : "Checking services..."}
      </p>
      <div className="space-y-3">
        {health?.services.map((service) => {
          const config = statusConfig[service.status] || statusConfig.unknown;
          const Icon = config.icon;
          return (
            <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  {service.message && (
                    <p className="text-xs text-muted-foreground">{service.message}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
                {service.responseTime !== undefined && (
                  <p className="text-xs text-muted-foreground">{service.responseTime}ms</p>
                )}
              </div>
            </div>
          );
        })}
        {!health && loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Checking services...</span>
          </div>
        )}
      </div>
    </div>
  );
}
