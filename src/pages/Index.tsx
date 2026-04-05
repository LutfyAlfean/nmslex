import { Shield, Activity, Server, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import AlertsTable from "@/components/AlertsTable";
import TrafficChart from "@/components/TrafficChart";
import ServiceStatus from "@/components/ServiceStatus";

export default function Index() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground text-sm">Real-time network monitoring & threat detection</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Alerts" value="1,247" change="↑ 12% from yesterday" changeType="up" icon={Shield} />
          <StatCard title="Active Threats" value="23" change="↓ 5 resolved" changeType="down" icon={AlertTriangle} />
          <StatCard title="Network Uptime" value="99.97%" change="Last 30 days" changeType="neutral" icon={Activity} />
          <StatCard title="Active Agents" value="14" change="2 pending" changeType="neutral" icon={Server} />
        </div>

        {/* Charts and Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrafficChart />
          </div>
          <ServiceStatus />
        </div>

        {/* Alerts Table */}
        <AlertsTable />
      </div>
    </DashboardLayout>
  );
}
