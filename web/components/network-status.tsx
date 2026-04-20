"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

type Status = "online" | "offline" | "syncing";

export function NetworkStatus() {
  const [status, setStatus] = useState<Status>("online");
  const [pendingCount] = useState(0);

  useEffect(() => {
    const update = () =>
      setStatus(navigator.onLine ? "online" : "offline");
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const styles: Record<Status, string> = {
    online:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    offline:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    syncing:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  };

  const label: Record<Status, string> = {
    online: "Online",
    offline: "Offline",
    syncing: `Sinkronisasi (${pendingCount})`,
  };

  const Icon =
    status === "online" ? Wifi : status === "offline" ? WifiOff : RefreshCw;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${styles[status]}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={`h-4 w-4 ${status === "syncing" ? "animate-spin" : ""}`}
      />
      <span>{label[status]}</span>
    </div>
  );
}
