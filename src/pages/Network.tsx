import { Activity, Wifi, Globe, HardDrive } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const protocolData = [
  { name: "TCP", value: 45230 },
  { name: "UDP", value: 12340 },
  { name: "ICMP", value: 2100 },
  { name: "DNS", value: 8900 },
  { name: "HTTP/S", value: 32100 },
  { name: "SSH", value: 4500 },
];

const topTalkers = [
  { ip: "192.168.1.10", packets: 125000 },
  { ip: "192.168.1.20", packets: 98000 },
  { ip: "10.0.0.50", packets: 87000 },
  { ip: "192.168.1.105", packets: 65000 },
  { ip: "192.168.1.30", packets: 54000 },
];

const pieColors = [
  "hsl(170, 80%, 45%)", "hsl(199, 89%, 48%)", "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(280, 70%, 50%)",
];

const interfaces = [
  { name: "eth0", status: "UP", speed: "1 Gbps", rx: "2.4 TB", tx: "1.8 TB", icon: Globe },
  { name: "eth1", status: "UP", speed: "10 Gbps", rx: "12.1 TB", tx: "8.7 TB", icon: Wifi },
  { name: "bond0", status: "UP", speed: "20 Gbps", rx: "14.5 TB", tx: "10.5 TB", icon: HardDrive },
];

export default function Network() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Network Overview
          </h2>
          <p className="text-muted-foreground text-sm">Traffic analysis & network interfaces</p>
        </div>

        {/* Interfaces */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {interfaces.map(iface => (
            <div key={iface.name} className="glass rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <iface.icon className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground font-mono">{iface.name}</span>
                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full ml-auto">{iface.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{iface.speed}</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-secondary/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">RX</p>
                  <p className="text-sm font-semibold text-foreground">{iface.rx}</p>
                </div>
                <div className="bg-secondary/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">TX</p>
                  <p className="text-sm font-semibold text-foreground">{iface.tx}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Talkers</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTalkers}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="ip" stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px", color: "hsl(180, 10%, 90%)" }} />
                <Bar dataKey="packets" fill="hsl(170, 80%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass rounded-xl p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">Protocol Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={protocolData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                  {protocolData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px", color: "hsl(180, 10%, 90%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
