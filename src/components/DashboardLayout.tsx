import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Server,
  Settings,
  Activity,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  Monitor,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/alerts", label: "Alerts", icon: Shield },
  { path: "/logs", label: "Logs", icon: FileText },
  { path: "/agents", label: "Agents", icon: Server },
  { path: "/network", label: "Network", icon: Activity },
  { path: "/topology", label: "Topology", icon: Globe },
  { path: "/server", label: "Server", icon: Monitor },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } flex-shrink-0 bg-card/40 backdrop-blur-xl border-r border-border/30 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/30">
          <img src="/nmslex-logo.png" alt="NMSLEX" className="w-8 h-8 rounded-lg flex-shrink-0" />
          {sidebarOpen && (
            <span className="text-base font-bold text-gradient truncate">NMSLEX</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />
                {sidebarOpen && <span className="text-[13px] font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-border/30 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            {sidebarOpen && <span className="text-[11px] text-muted-foreground">All systems operational</span>}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            {sidebarOpen && <span className="text-[13px]">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-card/40 backdrop-blur-xl border-b border-border/30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] flex items-center justify-center text-destructive-foreground font-bold">3</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{user?.email?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs text-muted-foreground hidden md:block">{user?.email?.split("@")[0]}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
