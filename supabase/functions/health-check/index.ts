import { corsHeaders } from '@supabase/supabase-js/cors'

interface ServiceHealth {
  name: string;
  status: "running" | "warning" | "stopped" | "unknown";
  message?: string;
  responseTime?: number;
}

async function checkEndpoint(url: string, timeoutMs = 5000): Promise<{ ok: boolean; status: number; responseTime: number; body?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const body = await res.text();
    return { ok: res.ok, status: res.status, responseTime: Date.now() - start, body };
  } catch (e) {
    return { ok: false, status: 0, responseTime: Date.now() - start, body: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // The NMSLEX_HOST should be set as a secret pointing to the VM IP/hostname
  const nmslexHost = Deno.env.get('NMSLEX_HOST') || 'http://localhost';

  const services: ServiceHealth[] = [];

  // Check Elasticsearch
  const es = await checkEndpoint(`${nmslexHost}:9200/_cluster/health`);
  if (es.ok) {
    try {
      const data = JSON.parse(es.body || '{}');
      services.push({
        name: "Elasticsearch",
        status: data.status === "green" ? "running" : data.status === "yellow" ? "warning" : "stopped",
        message: `Cluster: ${data.status}, Nodes: ${data.number_of_nodes}`,
        responseTime: es.responseTime,
      });
    } catch {
      services.push({ name: "Elasticsearch", status: "running", responseTime: es.responseTime });
    }
  } else {
    services.push({ name: "Elasticsearch", status: "stopped", message: "Not responding", responseTime: es.responseTime });
  }

  // Check Kibana
  const kb = await checkEndpoint(`${nmslexHost}:5601/api/status`);
  services.push({
    name: "Kibana",
    status: kb.ok ? "running" : "stopped",
    message: kb.ok ? "Available" : "Not responding",
    responseTime: kb.responseTime,
  });

  // Check Suricata (via NMSLEX dashboard API proxy or direct)
  const sur = await checkEndpoint(`${nmslexHost}:7356/api/suricata-status`);
  services.push({
    name: "Suricata IDS/IPS",
    status: sur.ok ? "running" : "unknown",
    message: sur.ok ? "Active" : "Status unknown (check VM)",
    responseTime: sur.responseTime,
  });

  // Check NMSLEX Dashboard itself
  const dash = await checkEndpoint(`${nmslexHost}:7356`);
  services.push({
    name: "NMSLEX Dashboard",
    status: dash.ok ? "running" : "stopped",
    message: dash.ok ? "Serving" : "Not responding",
    responseTime: dash.responseTime,
  });

  // Check Filebeat
  const fb = await checkEndpoint(`${nmslexHost}:5066`);
  services.push({
    name: "Filebeat",
    status: fb.ok ? "running" : "unknown",
    message: fb.ok ? "Active" : "Stats endpoint unavailable",
    responseTime: fb.responseTime,
  });

  const allHealthy = services.every(s => s.status === "running");
  const hasErrors = services.some(s => s.status === "stopped");

  return new Response(JSON.stringify({
    overall: hasErrors ? "degraded" : allHealthy ? "healthy" : "partial",
    services,
    checkedAt: new Date().toISOString(),
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
