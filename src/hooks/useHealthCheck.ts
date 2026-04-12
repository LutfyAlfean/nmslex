import { useState, useEffect, useCallback, useRef } from "react";
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
  const hasLoadedRef = useRef(false);

  const check = useCallback(async (showLoading = false) => {
    const shouldShowLoading = showLoading || !hasLoadedRef.current;
    if (shouldShowLoading) {
      setLoading(true);
    }

    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("health-check");
      if (fnError) throw fnError;
      setHealth(data as HealthData);
      hasLoadedRef.current = true;
    } catch (e: any) {
      setError(e.message || "Health check failed");
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
      hasLoadedRef.current = true;
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    check();

    if (effectiveInterval > 0) {
      const interval = setInterval(() => {
        void check(false);
      }, effectiveInterval);

      return () => clearInterval(interval);
    }
  }, [check, effectiveInterval]);

  return {
    health,
    loading,
    error,
    refresh: () => check(true),
  };
}
