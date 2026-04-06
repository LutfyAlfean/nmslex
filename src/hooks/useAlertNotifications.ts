import { useState, useEffect, useCallback, useRef } from "react";

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  timestamp: Date;
  read: boolean;
}

// Generate a simulated alert periodically for demo
const severities: Alert["severity"][] = ["critical", "high", "medium", "low"];
const alertMessages: Record<Alert["severity"], string[]> = {
  critical: [
    "CPU usage exceeded 95% on Server-01",
    "RAM usage critical on DB-Primary",
    "Disk space full on NAS-Backup",
    "Network interface down on Router-Core",
  ],
  high: [
    "Unusual traffic spike detected",
    "Failed login attempts > 100/min",
    "SSL certificate expiring in 3 days",
    "Suricata alert: Potential DDoS",
  ],
  medium: [
    "Memory usage above 75% on Web-02",
    "DNS query latency increased",
    "Filebeat connection timeout",
    "Agent heartbeat delayed: Node-05",
  ],
  low: [
    "Scheduled backup completed",
    "System update available",
    "New agent registered: Node-12",
    "Log rotation completed",
  ],
};

// Notification sound using Web Audio API
function playAlertSound(severity: Alert["severity"]) {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (severity === "critical") {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } else if (severity === "high") {
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else {
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Audio not supported
  }
}

export function useAlertNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const unreadCount = alerts.filter((a) => !a.read).length;

  const addAlert = useCallback(
    (severity: Alert["severity"], message: string) => {
      const newAlert: Alert = {
        id: crypto.randomUUID(),
        severity,
        message,
        timestamp: new Date(),
        read: false,
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
      if (soundEnabled) {
        playAlertSound(severity);
      }
    },
    [soundEnabled]
  );

  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Simulate incoming alerts for demo
  useEffect(() => {
    // Initial alerts
    const initialAlerts: Alert[] = [
      {
        id: crypto.randomUUID(),
        severity: "critical",
        message: "CPU usage exceeded 92% on Server-01",
        timestamp: new Date(Date.now() - 120000),
        read: false,
      },
      {
        id: crypto.randomUUID(),
        severity: "high",
        message: "Unusual traffic spike from 10.0.0.45",
        timestamp: new Date(Date.now() - 300000),
        read: false,
      },
      {
        id: crypto.randomUUID(),
        severity: "medium",
        message: "Agent heartbeat delayed: Node-03",
        timestamp: new Date(Date.now() - 600000),
        read: false,
      },
    ];
    setAlerts(initialAlerts);

    // Random alerts every 30-90 seconds
    const scheduleNext = () => {
      const delay = 30000 + Math.random() * 60000;
      intervalRef.current = setTimeout(() => {
        const sev = severities[Math.floor(Math.random() * severities.length)];
        const msgs = alertMessages[sev];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        addAlert(sev, msg);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [addAlert]);

  return {
    alerts,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    markAllRead,
    clearAlerts,
    addAlert,
  };
}
