"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArchivarCliente({ id, nombre, archivado }: { id: number; nombre: string; archivado: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleArchive() {
    const action = archivado ? "reactivar" : "archivar";
    const detail = archivado
      ? `¿Reactivar a ${nombre}? Volverá a aparecer entre los clientes activos.`
      : `¿Archivar a ${nombre}? Su ficha, mascotas e historia clínica se conservarán y dejará de aparecer entre los clientes activos.`;
    if (!window.confirm(detail)) return;
    setBusy(true);
    const response = await fetch(`/api/clientes/${id}/archivar`, { method: "PATCH" });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      window.alert(body?.error || `No se pudo ${action} al cliente.`);
      return;
    }
    router.refresh();
  }

  return <button type="button" onClick={toggleArchive} disabled={busy} className={`inline-flex rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${archivado ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-amber-200 text-amber-800 hover:bg-amber-50"}`}>{busy ? "Guardando…" : archivado ? "↻ Reactivar" : "🗃️ Archivar"}</button>;
}
