"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function EliminarEcografia({ id }: { id: number }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function remove() { if (!window.confirm("¿Eliminar esta ecografía? Esta acción no se puede deshacer.")) return; setBusy(true); const response = await fetch(`/api/ecografias/${id}`, { method: "DELETE" }); setBusy(false); if (!response.ok) { const body = await response.json().catch(() => null); window.alert(body?.error || "No se pudo eliminar"); return; } router.refresh(); }
  return <button type="button" onClick={remove} disabled={busy} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">{busy ? "…" : "🗑️ Eliminar"}</button>;
}
