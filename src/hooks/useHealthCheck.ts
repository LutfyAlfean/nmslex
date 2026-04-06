import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceHealth {
  name: string;
  status: "running" | "warning" | "stopped" | "unknown";
  message?: string;
  responseTime?: number;
}

interface HealthData {
  overall: "healthy" | "degraded" | "partial";
  services: ServiceHealth[];
  checkedAt: string;
}

export function useHealthCheck(autoRefreshMs = 60000) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("health-check");
      if (fnError) throw fnError;
      setHealth(data as HealthData);
    } catch (e: any) {
      setError(e.message || "Health check failed");
      // Fallback: show all services as unknown
      setHealth({
        overall: "degraded",
        services: [
          { name: "Elasticsearch", status: "unknown", message: "Cannot reach health endpoint" },
          { name: "Kibana", status: "unknown", message: "Cannot reach health endpoint" },
          { name: "Suricata IDS/IPS", status: "unknown", message: "Cannot reach health endpoint" },
          { name: "NMSLEX Dashboard", status: "unknown", message: "Cannot reach health endpoint" },
          { name: "Filebeat", status: "unknown", message: "Cannot reach health endpoint" },
        ],
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
    if (autoRefreshMs > 0) {
      const interval = setInterval(check, autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [check, autoRefreshMs]);

  return { health, loading, error, refresh: check };
}
