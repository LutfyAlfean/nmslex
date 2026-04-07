import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEALTH_POLL_MS = 10000; // 10s default polling

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
  const effectiveInterval = Math.min(autoRefreshMs, HEALTH_POLL_MS);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    const isInitialLoad = !health;
    if (isInitialLoad) {
      setLoading(true);
    }
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
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [health]);

  useEffect(() => {
    check();
    if (effectiveInterval > 0) {
      const interval = setInterval(check, effectiveInterval);
      return () => clearInterval(interval);
    }
  }, [check, effectiveInterval]);

  return { health, loading, error, refresh: check };
}
