import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      // Supabase handles the session automatically
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Password tidak sama");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <img src="/nmslex-logo.png" alt="NMSLEX" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        </div>

        <div className="glass rounded-2xl p-8">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-foreground font-medium">Password berhasil diubah!</p>
              <p className="text-muted-foreground text-sm mt-1">Mengalihkan ke dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</p>}
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-lg text-sm text-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary rounded-lg text-sm font-medium text-primary-foreground hover:bg-primary/90 glow-primary disabled:opacity-50">
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
