import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { health, loading: healthLoading } = useHealthCheck(30000);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,5%)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[hsl(170,80%,45%)]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-[hsl(170,80%,30%)]/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-[hsl(199,89%,48%)]/5 rounded-full blur-[80px]" />
      </div>

      {/* Panda gripping the card from behind */}
      <div className="relative z-10 w-full max-w-md">
        {/* Panda image positioned behind and above the card */}
        <div className="flex justify-center -mb-16 relative z-0">
          <img
            src="/panda-grip.png"
            alt="NMSLEX Panda"
            width={280}
            height={280}
            className="drop-shadow-[0_0_40px_hsl(170,80%,45%,0.4)] animate-float"
          />
        </div>

        {/* Login Card */}
        <div className="relative z-10 animate-slide-up">
          <div className="bg-[hsl(220,18%,10%)]/80 backdrop-blur-2xl border border-[hsl(170,80%,45%)]/20 rounded-2xl p-8 shadow-[0_0_60px_-20px_hsl(170,80%,45%,0.3)]">
            {/* Logo area */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold text-gradient tracking-tight">NMSLEX</h1>
              <p className="text-muted-foreground text-xs mt-1 tracking-widest uppercase">Network Management System</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[hsl(170,80%,45%)]/30 to-transparent mb-6" />

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[hsl(170,80%,45%)]/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <p className="text-foreground font-medium">Email terkirim!</p>
                <p className="text-muted-foreground text-sm mt-1">Cek inbox kamu untuk link reset password.</p>
                <button onClick={() => { setResetMode(false); setResetSent(false); }} className="mt-4 text-primary text-sm hover:underline">
                  Kembali ke login
                </button>
              </div>
            ) : (
              <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 uppercase tracking-wider">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adminlex@nmslex.com"
                      className="w-full pl-10 pr-4 py-3 bg-[hsl(220,15%,14%)]/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground border border-[hsl(170,80%,45%)]/10 focus:outline-none focus:ring-2 focus:ring-[hsl(170,80%,45%)]/40 focus:border-[hsl(170,80%,45%)]/30 transition-all"
                      required
                    />
                  </div>
                </div>

                {!resetMode && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-[hsl(220,15%,14%)]/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground border border-[hsl(170,80%,45%)]/10 focus:outline-none focus:ring-2 focus:ring-[hsl(170,80%,45%)]/40 focus:border-[hsl(170,80%,45%)]/30 transition-all"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[hsl(170,80%,40%)] to-[hsl(170,80%,50%)] rounded-xl text-sm font-bold text-[hsl(220,20%,7%)] hover:from-[hsl(170,80%,45%)] hover:to-[hsl(170,80%,55%)] transition-all shadow-[0_0_30px_-5px_hsl(170,80%,45%,0.5)] hover:shadow-[0_0_40px_-5px_hsl(170,80%,45%,0.7)] disabled:opacity-50 uppercase tracking-wider"
                >
                  {loading ? "Loading..." : resetMode ? "Kirim Link Reset" : "Sign In"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setResetMode(!resetMode); setError(""); }}
                    className="text-primary text-xs hover:underline opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {resetMode ? "Kembali ke login" : "Lupa password?"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Claw scratch marks */}
          <div className="absolute -top-1 left-6 w-0.5 h-8 bg-gradient-to-b from-[hsl(170,80%,45%)]/40 to-transparent rounded-full" />
          <div className="absolute -top-1 left-9 w-0.5 h-12 bg-gradient-to-b from-[hsl(170,80%,45%)]/30 to-transparent rounded-full" />
          <div className="absolute -top-1 right-6 w-0.5 h-8 bg-gradient-to-b from-[hsl(170,80%,45%)]/40 to-transparent rounded-full" />
          <div className="absolute -top-1 right-9 w-0.5 h-12 bg-gradient-to-b from-[hsl(170,80%,45%)]/30 to-transparent rounded-full" />
        </div>

        {/* Service Status Indicator */}
        <div className="mt-4">
          <button
            onClick={() => setShowHealth(!showHealth)}
            className="flex items-center gap-2 mx-auto text-muted-foreground hover:text-foreground transition-colors text-[11px]"
          >
            {healthLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : health?.overall === "healthy" ? (
              <CheckCircle className="w-3 h-3 text-success" />
            ) : health?.overall === "degraded" ? (
              <XCircle className="w-3 h-3 text-destructive" />
            ) : (
              <HelpCircle className="w-3 h-3 text-warning" />
            )}
            <span>
              {healthLoading ? "Checking services..." : health?.overall === "healthy" ? "All services operational" : health?.overall === "degraded" ? "Service issues detected" : "Partial availability"}
            </span>
            {showHealth ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showHealth && health && (
            <div className="mt-2 p-3 rounded-xl bg-[hsl(220,18%,10%)]/80 backdrop-blur border border-[hsl(170,80%,45%)]/10 space-y-2">
              {health.services.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    {svc.status === "running" ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : svc.status === "stopped" ? (
                      <XCircle className="w-3 h-3 text-destructive" />
                    ) : (
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-foreground">{svc.name}</span>
                  </div>
                  <span className={svc.status === "running" ? "text-success" : svc.status === "stopped" ? "text-destructive" : "text-muted-foreground"}>
                    {svc.status === "running" ? "OK" : svc.status === "stopped" ? "DOWN" : "N/A"}
                    {svc.responseTime !== undefined && ` (${svc.responseTime}ms)`}
                  </span>
                </div>
              ))}
              {health.services.some(s => s.status === "stopped") && (
                <p className="text-[10px] text-destructive/80 pt-1 border-t border-border/20">
                  ⚠ Beberapa service mati. Dashboard mungkin blank. Jalankan: <code className="bg-secondary/50 px-1 rounded">sudo ./deploy.sh --status</code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-[10px] mt-3 opacity-50">
          Default: adminlex@nmslex.com • Password di-generate saat deploy
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
