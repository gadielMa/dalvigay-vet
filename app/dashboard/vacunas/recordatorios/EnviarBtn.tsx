"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EnviarBtn({ vacId, disabled }: { vacId: number; disabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setStatus("sending");
    try {
      const res = await fetch("/api/recordatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vac_id: vacId }),
      });
      if (res.ok) setStatus("sent");
      else { const payload = await res.json().catch(() => null); setStatus(payload?.error?.includes("RESEND_API_KEY") ? "error" : "error"); }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") return <span className="text-green-600 text-xs font-medium">✓ Enviado</span>;
  if (status === "error") return <span className="text-red-500 text-xs" title="Configurá RESEND_API_KEY en Render para enviar emails">Email no configurado</span>;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || status === "sending"}
      onClick={handleClick}
      title={disabled ? "Sin email registrado" : "Enviar recordatorio"}
    >
      {status === "sending" ? "…" : "📧"}
    </Button>
  );
}
