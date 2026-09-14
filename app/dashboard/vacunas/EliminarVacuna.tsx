"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function EliminarVacuna({ id }: { id: number }) { const router=useRouter(); const [busy,setBusy]=useState(false); async function remove(){if(!confirm("¿Eliminar esta vacuna? Esta acción no se puede deshacer."))return;setBusy(true);const r=await fetch(`/api/vacunas/${id}`,{method:"DELETE"});setBusy(false);if(!r.ok){const b=await r.json().catch(()=>null);alert(b?.error||"No se pudo eliminar");return;}router.refresh();} return <button type="button" disabled={busy} onClick={remove} className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50">{busy?"…":"🗑️"}</button>; }
