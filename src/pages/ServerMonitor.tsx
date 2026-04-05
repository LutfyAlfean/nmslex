import { useState } from "react";
import { Monitor, Cpu, MemoryStick, HardDrive, Thermometer, AlertTriangle, ArrowUpCircle, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 10%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "8px",
  color: "hsl(180, 10%, 90%)",
  fontSize: "12px",
};

// Simulated server metrics
const serverInfo = {
  hostname: "nmslex-master",
  os: "Ubuntu 22.04 LTS",
  kernel: "5.15.0-105-generic",
  uptime: "45d 12h 33m",
  cpu_model: "Intel Xeon E5-2680 v4",
  cpu_cores: 4,
  ram_total: "16 GB",
  disk_total: "200 GB SSD",
  agents: 12,
};

const currentMetrics = {
  cpu: 68,
  ram: 74,
  disk: 62,
  swap: 15,
  load_1: 2.45,
  load_5: 2.12,
  load_15: 1.89,
  temp: 61,
  iowait: 8.3,
  net_rx: "245 Mbps",
  net_tx: "120 Mbps",
};

function generateHistory(base: number, variance: number) {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    const h = (new Date().getHours() - i + 24) % 24;
    data.push({
      time: `${String(h).padStart(2, "0")}:00`,
      value: Math.min(100, Math.max(5, base + (Math.random() - 0.4) * variance)),
    });
  }
  return data;
}

const cpuHistory = generateHistory(65, 30);
const ramHistory = generateHistory(72, 15);
const diskHistory = generateHistory(60, 5);

// Auto-scaling recommendations
function getRecommendations(metrics: typeof currentMetrics, info: typeof serverInfo) {
  const recs: { severity: "critical" | "warning" | "info"; title: string; description: string; action: string }[] = [];

  if (metrics.cpu > 80) {
    recs.push({
      severity: "critical",
      title: "CPU Usage Tinggi",
      description: `CPU saat ini ${metrics.cpu}% — mendekati limit. Dengan ${info.agents} agent aktif, server butuh lebih banyak vCPU.`,
      action: `Upgrade ke ${info.cpu_cores * 2} vCPU atau kurangi jumlah agent.`,
    });
  } else if (metrics.cpu > 60) {
    recs.push({
      severity: "warning",
      title: "CPU Usage Meningkat",
      description: `CPU di ${metrics.cpu}%. Jika bertambah agent, pertimbangkan upgrade.`,
      action: `Siapkan upgrade ke ${info.cpu_cores + 2} vCPU jika agent bertambah di atas 15.`,
    });
  }

  if (metrics.ram > 85) {
    recs.push({
      severity: "critical",
      title: "RAM Hampir Penuh",
      description: `RAM usage ${metrics.ram}% dari ${info.ram_total}. Elasticsearch membutuhkan RAM yang cukup untuk indexing.`,
      action: `Upgrade RAM ke ${parseInt(info.ram_total) * 2} GB segera.`,
    });
  } else if (metrics.ram > 65) {
    recs.push({
      severity: "warning",
      title: "RAM Usage di Atas Normal",
      description: `RAM ${metrics.ram}% — Elasticsearch menggunakan sebagian besar. Monitor terus.`,
      action: `Pertimbangkan upgrade ke ${parseInt(info.ram_total) + 8} GB jika trend naik.`,
    });
  }

  if (metrics.disk > 80) {
    recs.push({
      severity: "critical",
      title: "Disk Hampir Penuh",
      description: `Disk usage ${metrics.disk}% dari ${info.disk_total}. Log Suricata dan Elasticsearch indices memakan banyak space.`,
      action: `Tambah disk ke ${parseInt(info.disk_total) * 2} GB atau aktifkan log rotation.`,
    });
  } else if (metrics.disk > 55) {
    recs.push({
      severity: "info",
      title: "Disk Usage Normal-Tinggi",
      description: `Disk di ${metrics.disk}%. Dengan growth rate saat ini, disk penuh dalam ~30 hari.`,
      action: `Aktifkan ILM (Index Lifecycle Management) di Elasticsearch untuk auto-delete log > 14 hari.`,
    });
  }

  if (metrics.load_1 > info.cpu_cores * 0.8) {
    recs.push({
      severity: "warning",
      title: "Load Average Tinggi",
      description: `Load average ${metrics.load_1} mendekati jumlah core (${info.cpu_cores}).`,
      action: `Optimize Suricata rules atau tambah vCPU.`,
    });
  }

  if (metrics.iowait > 10) {
    recs.push({
      severity: "warning",
      title: "I/O Wait Tinggi",
      description: `I/O wait ${metrics.iowait}% — disk bottleneck terdeteksi.`,
      action: `Pertimbangkan upgrade ke NVMe SSD untuk performa Elasticsearch lebih baik.`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      severity: "info",
      title: "Semua Resource Normal",
      description: "Server berjalan dalam batas normal. Tidak ada scaling yang diperlukan saat ini.",
      action: "Tetap monitor secara berkala.",
    });
  }

  return recs;
}

const recommendations = getRecommendations(currentMetrics, serverInfo);

function GaugeCard({ label, value, icon: Icon, color, unit = "%" }: { label: string; value: number; icon: any; color: string; unit?: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  const statusColor = value > 85 ? "text-destructive" : value > 65 ? "text-warning" : "text-success";

  return (
    <div className="glass rounded-xl p-5 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(220, 15%, 18%)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={value > 85 ? "hsl(0, 72%, 51%)" : value > 65 ? "hsl(38, 92%, 50%)" : "hsl(170, 80%, 45%)"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${statusColor}`}>{value}</span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}

const sevStyles = {
  critical: { bg: "bg-destructive/10 border-destructive/30", icon: "text-destructive", badge: "bg-destructive/20 text-destructive" },
  warning: { bg: "bg-warning/10 border-warning/30", icon: "text-warning", badge: "bg-warning/20 text-warning" },
  info: { bg: "bg-info/10 border-info/30", icon: "text-info", badge: "bg-info/20 text-info" },
};

export default function ServerMonitor() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary" /> Server Monitor
            </h2>
            <p className="text-muted-foreground text-sm">NMSLEX Master Node — Resource usage & auto-scaling</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Uptime: {serverInfo.uptime}</span>
          </div>
        </div>

        {/* Server Info Bar */}
        <div className="glass rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2">
          {[
            { l: "Hostname", v: serverInfo.hostname },
            { l: "OS", v: serverInfo.os },
            { l: "CPU", v: `${serverInfo.cpu_model} (${serverInfo.cpu_cores} cores)` },
            { l: "RAM", v: serverInfo.ram_total },
            { l: "Disk", v: serverInfo.disk_total },
            { l: "Agents", v: `${serverInfo.agents} active` },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{item.l}:</span>
              <span className="text-[11px] text-foreground font-mono">{item.v}</span>
            </div>
          ))}
        </div>

        {/* Gauge Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GaugeCard label="CPU" value={currentMetrics.cpu} icon={Cpu} color="text-primary" />
          <GaugeCard label="RAM" value={currentMetrics.ram} icon={MemoryStick} color="text-info" />
          <GaugeCard label="Disk" value={currentMetrics.disk} icon={HardDrive} color="text-warning" />
          <GaugeCard label="Temperature" value={currentMetrics.temp} icon={Thermometer} color="text-destructive" unit="°C" />
        </div>

        {/* Extra Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Load 1m", value: currentMetrics.load_1.toFixed(2) },
            { label: "Load 5m", value: currentMetrics.load_5.toFixed(2) },
            { label: "Load 15m", value: currentMetrics.load_15.toFixed(2) },
            { label: "I/O Wait", value: `${currentMetrics.iowait}%` },
            { label: "Swap", value: `${currentMetrics.swap}%` },
          ].map((m) => (
            <div key={m.label} className="glass rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className="text-lg font-semibold text-foreground font-mono">{m.value}</p>
            </div>
          ))}
        </div>

        {/* History Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: "CPU History (24h)", data: cpuHistory, color: "170, 80%, 45%", id: "cpu" },
            { title: "RAM History (24h)", data: ramHistory, color: "199, 89%, 48%", id: "ram" },
            { title: "Disk History (24h)", data: diskHistory, color: "38, 92%, 50%", id: "disk" },
          ].map((chart) => (
            <div key={chart.id} className="glass rounded-xl p-4">
              <h4 className="text-sm font-medium text-foreground mb-3">{chart.title}</h4>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chart.data}>
                  <defs>
                    <linearGradient id={`g-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`hsl(${chart.color})`} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={`hsl(${chart.color})`} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="time" stroke="hsl(220, 10%, 50%)" fontSize={10} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={10} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                  <Area type="monotone" dataKey="value" stroke={`hsl(${chart.color})`} fill={`url(#g-${chart.id})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {/* Auto-Scaling Recommendations */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Auto-Scaling Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const style = sevStyles[rec.severity];
              return (
                <div key={i} className={`rounded-lg border p-4 ${style.bg}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{rec.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.badge} capitalize`}>{rec.severity}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">{rec.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scaling Guide */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">📋 Scaling Reference</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Agents", "vCPU", "RAM", "Disk", "Status"].map(h => (
                    <th key={h} className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { agents: "1–5", cpu: "2", ram: "4 GB", disk: "50 GB", current: false },
                  { agents: "6–10", cpu: "4", ram: "8 GB", disk: "100 GB", current: false },
                  { agents: "11–20", cpu: "4", ram: "16 GB", disk: "200 GB", current: true },
                  { agents: "21–30", cpu: "8", ram: "32 GB", disk: "500 GB", current: false },
                  { agents: "31–50", cpu: "8", ram: "32 GB", disk: "500 GB", current: false },
                  { agents: "50+", cpu: "16", ram: "64 GB", disk: "1 TB", current: false },
                ].map((row) => (
                  <tr key={row.agents} className={`border-b border-border/20 ${row.current ? "bg-primary/5" : ""}`}>
                    <td className="p-2 text-xs font-mono text-foreground">{row.agents}</td>
                    <td className="p-2 text-xs text-foreground">{row.cpu}</td>
                    <td className="p-2 text-xs text-foreground">{row.ram}</td>
                    <td className="p-2 text-xs text-foreground">{row.disk}</td>
                    <td className="p-2">
                      {row.current && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Current</span>}
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
