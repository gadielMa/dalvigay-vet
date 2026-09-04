"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tipos = [{ id: "ecografia", label: "🔬 Nueva ecografía" }, { id: "rayos", label: "☢️ Nuevo Rayos X" }, { id: "hemograma", label: "🩸 Nuevo hemograma" }, { id: "orina", label: "🧪 Nuevo análisis de orina" }, { id: "quimica", label: "⚗️ Nueva química sanguínea" }];
export function ClinicalAdditions({ pacienteId }: { pacienteId: number }) {
  const router = useRouter(); const [open, setOpen] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, tipo: string) { event.preventDefault(); setError(""); setBusy(true); const body = Object.fromEntries(new FormData(event.currentTarget)); const response = await fetch("/api/practicas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, tipo, paciente_id: pacienteId }) }); const payload = await response.json(); setBusy(false); if (!response.ok) return setError(payload.error ?? "No se pudo guardar"); event.currentTarget.reset(); setOpen(""); router.refresh(); }
  return <div className="mb-3 flex flex-wrap gap-2">{tipos.map((tipo) => open === tipo.id ? <form key={tipo.id} onSubmit={(event) => submit(event, tipo.id)} className="w-full grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-2"><strong className="sm:col-span-2 text-sm text-slate-700">{tipo.label}</strong><Input name="fecha" type="date" required/><Input name="dr" placeholder="Veterinario/a"/><Input name="titulo" placeholder="Tipo de estudio"/><textarea name="detalle" placeholder="Resultado / observaciones" required className="min-h-24 rounded-lg border p-2 text-sm sm:col-span-2"/><div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button><Button type="button" variant="outline" onClick={() => setOpen("")}>Cancelar</Button></div>{error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}</form> : <Button key={tipo.id} size="sm" variant="outline" onClick={() => { setError(""); setOpen(tipo.id); }}>{tipo.label}</Button>)}</div>;
}
