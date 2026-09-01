"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  if (!installEvent) return null;
  return <button type="button" onClick={async () => { await installEvent.prompt(); setInstallEvent(null); }} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-800">Instalar</button>;
}
