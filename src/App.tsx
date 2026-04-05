import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Alerts from "./pages/Alerts";
import Logs from "./pages/Logs";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Network from "./pages/Network";
import SettingsPage from "./pages/SettingsPage";
import ServerMonitor from "./pages/ServerMonitor";
import Topology from "./pages/Topology";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="NMSLEX" className="w-16 h-16 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
    <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
    <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
    <Route path="/agents/:id" element={<ProtectedRoute><AgentDetail /></ProtectedRoute>} />
    <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/server" element={<ProtectedRoute><ServerMonitor /></ProtectedRoute>} />
    <Route path="/topology" element={<ProtectedRoute><Topology /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
