import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "00:00", inbound: 2400, outbound: 1800, threats: 12 },
  { time: "02:00", inbound: 1398, outbound: 1200, threats: 5 },
  { time: "04:00", inbound: 980, outbound: 800, threats: 3 },
  { time: "06:00", inbound: 3908, outbound: 2800, threats: 18 },
  { time: "08:00", inbound: 4800, outbound: 3600, threats: 25 },
  { time: "10:00", inbound: 3800, outbound: 2900, threats: 15 },
  { time: "12:00", inbound: 4300, outbound: 3400, threats: 22 },
  { time: "14:00", inbound: 5200, outbound: 4100, threats: 30 },
  { time: "16:00", inbound: 4900, outbound: 3800, threats: 28 },
  { time: "18:00", inbound: 3600, outbound: 2700, threats: 14 },
  { time: "20:00", inbound: 2800, outbound: 2100, threats: 8 },
  { time: "22:00", inbound: 2200, outbound: 1600, threats: 6 },
];

export default function TrafficChart() {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-1">Network Traffic</h3>
      <p className="text-sm text-muted-foreground mb-4">Real-time traffic monitored via Filebeat</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="inbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(170, 80%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(170, 80%, 45%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="threats" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
          <XAxis dataKey="time" stroke="hsl(220, 10%, 50%)" fontSize={12} />
          <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 10%)",
              border: "1px solid hsl(220, 15%, 18%)",
              borderRadius: "8px",
              color: "hsl(180, 10%, 90%)",
            }}
          />
          <Area type="monotone" dataKey="inbound" stroke="hsl(170, 80%, 45%)" fillOpacity={1} fill="url(#inbound)" />
          <Area type="monotone" dataKey="outbound" stroke="hsl(199, 89%, 48%)" fillOpacity={1} fill="url(#outbound)" />
          <Area type="monotone" dataKey="threats" stroke="hsl(0, 72%, 51%)" fillOpacity={1} fill="url(#threats)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
