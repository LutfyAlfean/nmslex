import { useState } from "react";
import { Send, MessageCircle, CheckCircle, XCircle, Copy, ExternalLink, AlertTriangle, Bot, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const steps = [
  {
    title: "1. Buat Bot di BotFather",
    icon: Bot,
    content: [
      "Buka Telegram dan cari @BotFather",
      "Kirim perintah /newbot",
      "Ikuti instruksi: beri nama bot (contoh: NMSLEX Alert Bot)",
      "Beri username bot (contoh: nmslex_alert_bot)",
      "BotFather akan memberikan token API — simpan token ini",
    ],
    note: "Token sudah dikonfigurasi melalui connector. Anda tidak perlu menyimpannya manual.",
  },
  {
    title: "2. Dapatkan Chat ID",
    icon: MessageCircle,
    content: [
      "Buka bot Anda di Telegram dan kirim pesan apa saja (misal: /start)",
      'Buka browser: https://api.telegram.org/bot<TOKEN>/getUpdates',
      'Cari "chat":{"id": 123456789} — angka itu adalah Chat ID Anda',
      "Atau gunakan bot @userinfobot untuk mendapatkan Chat ID",
      "Untuk grup: tambahkan bot ke grup, kirim pesan, lalu cek getUpdates",
    ],
    note: "Chat ID bisa berupa angka positif (user) atau negatif (grup).",
  },
  {
    title: "3. Test Koneksi",
    icon: Send,
    content: [
      "Masukkan Chat ID di form di bawah",
      'Klik tombol "Test Notifikasi"',
      "Cek Telegram — Anda akan menerima pesan test dari bot",
      "Jika berhasil, bot siap mengirim notifikasi realtime!",
    ],
  },
  {
    title: "4. Auto Alert (CPU/RAM/Disk)",
    icon: AlertTriangle,
    content: [
      "NMSLEX secara otomatis mengirim alert ke Telegram ketika:",
      "🔴 CPU > 90% — Critical Alert",
      "🔴 RAM > 90% — Critical Alert",
      "🔴 Disk > 90% — Critical Alert",
      "🟠 CPU/RAM > 80% — High Alert",
      "🟠 Disk > 85% — High Alert",
      "Alert dikirim realtime saat threshold terlampaui",
    ],
  },
];

export default function TelegramSetup() {
  const [chatId, setChatId] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const handleTest = async () => {
    if (!chatId.trim()) {
      toast.error("Masukkan Chat ID terlebih dahulu");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-bot", {
        body: { action: "test", chat_id: chatId.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        setTestResult("success");
        toast.success("Test notifikasi berhasil dikirim!");
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err: any) {
      setTestResult("error");
      toast.error(`Gagal: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSendCustom = async () => {
    if (!chatId.trim() || !customMessage.trim()) {
      toast.error("Chat ID dan pesan harus diisi");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-bot", {
        body: { action: "send", chat_id: chatId.trim(), text: customMessage.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Pesan berhasil dikirim!");
        setCustomMessage("");
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err: any) {
      toast.error(`Gagal: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendAlert = async (severity: string) => {
    if (!chatId.trim()) {
      toast.error("Masukkan Chat ID terlebih dahulu");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("telegram-bot", {
        body: {
          action: "alert",
          chat_id: chatId.trim(),
          severity,
          title: `Test ${severity.toUpperCase()} Alert`,
          description: `Ini adalah test alert dengan severity ${severity} dari NMSLEX.`,
          source: "NMSLEX Dashboard",
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Alert ${severity} berhasil dikirim!`);
      }
    } catch (err: any) {
      toast.error(`Gagal: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Telegram Bot Setup
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Panduan lengkap integrasi bot Telegram untuk notifikasi realtime NMSLEX
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              </div>
              <ul className="space-y-2 ml-11">
                {step.content.map((line, j) => (
                  <li key={j} className="text-[13px] text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {step.note && (
                <div className="ml-11 mt-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[11px] text-primary">{step.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Form */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Test & Kirim Notifikasi
          </h3>

          <div className="space-y-4">
            {/* Chat ID */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Chat ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Masukkan Chat ID (contoh: 123456789)"
                  className="flex-1 px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {testing ? "Sending..." : "Test Notifikasi"}
                </button>
              </div>
              {testResult && (
                <div className={`flex items-center gap-1.5 mt-2 ${testResult === "success" ? "text-success" : "text-destructive"}`}>
                  {testResult === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span className="text-xs">{testResult === "success" ? "Berhasil! Cek Telegram Anda." : "Gagal. Periksa Chat ID."}</span>
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Pesan Custom</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Ketik pesan yang ingin dikirim..."
                  className="flex-1 px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={handleSendCustom}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim
                </button>
              </div>
            </div>

            {/* Alert Test Buttons */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Test Alert Severity</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { sev: "critical", color: "bg-destructive hover:bg-destructive/80 text-destructive-foreground", label: "🔴 Critical" },
                  { sev: "high", color: "bg-warning hover:bg-warning/80 text-warning-foreground", label: "🟠 High" },
                  { sev: "medium", color: "bg-primary/20 hover:bg-primary/30 text-foreground", label: "🟡 Medium" },
                  { sev: "low", color: "bg-secondary hover:bg-secondary/80 text-foreground", label: "🔵 Low" },
                ].map((a) => (
                  <button
                    key={a.sev}
                    onClick={() => handleSendAlert(a.sev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${a.color}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">📖 API Reference</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Send Message:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-primary bg-secondary/50 px-3 py-2 rounded-lg font-mono overflow-x-auto">
                  {`{ "action": "send", "chat_id": "YOUR_ID", "text": "Hello!" }`}
                </code>
                <button onClick={() => copyToClipboard(`{ "action": "send", "chat_id": "YOUR_ID", "text": "Hello!" }`)} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Send Alert:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-primary bg-secondary/50 px-3 py-2 rounded-lg font-mono overflow-x-auto">
                  {`{ "action": "alert", "chat_id": "YOUR_ID", "severity": "critical", "title": "Alert!", "description": "...", "source": "..." }`}
                </code>
                <button onClick={() => copyToClipboard(`{ "action": "alert", "chat_id": "YOUR_ID", "severity": "critical", "title": "Alert!", "description": "...", "source": "..." }`)} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">🔗 Useful Links</h3>
          <div className="space-y-2">
            {[
              { label: "BotFather", url: "https://t.me/BotFather" },
              { label: "Telegram Bot API Docs", url: "https://core.telegram.org/bots/api" },
              { label: "Get Chat ID Bot", url: "https://t.me/userinfobot" },
            ].map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
