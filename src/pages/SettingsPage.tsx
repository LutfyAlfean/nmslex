import { Settings, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Settings
          </h2>
          <p className="text-muted-foreground text-sm">NMSLEX configuration</p>
        </div>

        {/* Suricata Config */}
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Suricata Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Interface</label>
              <input defaultValue="eth0" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Rule Path</label>
              <input defaultValue="/etc/suricata/rules/" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Log Output</label>
              <input defaultValue="/var/log/suricata/eve.json" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Home Net</label>
              <input defaultValue="[192.168.0.0/16, 10.0.0.0/8]" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
          </div>
        </div>

        {/* Elasticsearch Config */}
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Elasticsearch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Host</label>
              <input defaultValue="https://localhost:9200" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Index Pattern</label>
              <input defaultValue="nmslex-suricata-*" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
          </div>
        </div>

        {/* Dashboard Config */}
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Port</label>
              <input defaultValue="7356" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Refresh Interval (sec)</label>
              <input defaultValue="30" className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 bg-primary rounded-lg text-sm text-primary-foreground hover:bg-primary/90 transition-colors glow-primary font-medium">
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>
    </DashboardLayout>
  );
}
