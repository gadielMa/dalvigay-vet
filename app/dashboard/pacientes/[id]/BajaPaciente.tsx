"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BajaPaciente({
  id,
  nombre,
  inactivo,
}: {
  id: number;
  nombre: string;
  inactivo: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function changeStatus() {
    const action = inactivo ? "reactivar" : "dar de baja";
    if (!window.confirm(`¿${inactivo ? "Reactivar" : "Dar de baja"} a ${nombre}? Su historia clínica, vacunas y estudios se conservarán.`)) return;
    setBusy(true);
    const response = await fetch(`/api/pacientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pac_fecha_des: inactivo ? "Vive" : "Inactivo" }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      window.alert(body?.error || `No se pudo ${action} al paciente.`);
      return;
    }
    router.push("/dashboard/pacientes");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={changeStatus}
      disabled={busy}
      className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
        inactivo
          ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          : "border-amber-200 text-amber-800 hover:bg-amber-50"
      }`}
    >
      {busy ? "Guardando…" : inactivo ? "↻ Reactivar paciente" : "Dar de baja"}
    </button>
  );
}
