import { useState, useRef, useEffect } from "react";
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
  FileBarChart,
  MessageCircle,
  Users,
  Volume2,
  VolumeX,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/alerts", label: "Alerts", icon: Shield },
  { path: "/logs", label: "Logs", icon: FileText },
  { path: "/agents", label: "Agents", icon: Server },
  { path: "/network", label: "Network", icon: Activity },
  { path: "/topology", label: "Topology", icon: Globe },
  { path: "/server", label: "Server", icon: Monitor },
  { path: "/reporting", label: "Reporting", icon: FileBarChart },
  { path: "/telegram-setup", label: "Telegram", icon: MessageCircle },
  { path: "/users", label: "Users", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings },
];

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  high: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  medium: { icon: Info, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary", border: "border-border/20" },
};

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { alerts, unreadCount, soundEnabled, setSoundEnabled, markAllRead, clearAlerts } = useAlertNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } flex-shrink-0 bg-card/40 backdrop-blur-xl border-r border-border/30 flex flex-col transition-all duration-300`}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/30">
          <img src="/logo.png" alt="NMSLEX" className="w-8 h-8 rounded-lg flex-shrink-0" />
          {sidebarOpen && (
            <span className="text-base font-bold text-gradient truncate">NMSLEX</span>
          )}
        </div>

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
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-1.5 rounded-lg transition-colors ${
                  notifOpen
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? "animate-[wiggle_0.5s_ease-in-out]" : ""}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-destructive rounded-full text-[9px] flex items-center justify-center text-destructive-foreground font-bold animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 max-h-[480px] bg-card border border-border/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title={soundEnabled ? "Mute" : "Unmute"}
                      >
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={markAllRead}
                        className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                        title="Mark all read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={clearAlerts}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title="Clear all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alert List */}
                  <div className="overflow-y-auto max-h-[380px]">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Bell className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-xs">No notifications</p>
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const config = severityConfig[alert.severity];
                        const Icon = config.icon;
                        return (
                          <div
                            key={alert.id}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-border/10 transition-colors ${
                              !alert.read ? "bg-primary/[0.03]" : ""
                            } hover:bg-secondary/30`}
                          >
                            <div className={`mt-0.5 p-1 rounded-md ${config.bg} ${config.border} border`}>
                              <Icon className={`w-3 h-3 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-semibold uppercase ${config.color}`}>
                                  {alert.severity}
                                </span>
                                {!alert.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(alert.timestamp)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

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
