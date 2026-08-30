"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cliente = { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null; cli_mail?: string | null };

export function ComunicacionPanel({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter(); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const res = await fetch("/api/comunicaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return setError((await res.json()).error ?? "No se pudo enviar el email");
    event.currentTarget.reset(); router.refresh();
  };
  return <form onSubmit={submit} className="space-y-2 bg-white border rounded-xl p-4 max-w-2xl">
    <select name="cliente_id" className="h-8 w-full rounded-lg border border-input px-2.5 text-sm" defaultValue="" required><option value="" disabled>Elegí un cliente con email</option>{clientes.filter((c) => c.cli_mail && c.cli_mail !== "0").map((c) => <option key={c.cli_id} value={c.cli_id}>{`${c.cli_apellido ?? ""}, ${c.cli_nombre ?? ""}`.replace(/^, /, "")} · {c.cli_mail}</option>)}</select>
    <Input name="asunto" placeholder="Asunto" required />
    <textarea name="mensaje" placeholder="Mensaje" required rows={6} className="w-full rounded-lg border border-input p-2.5 text-sm" />
    <Button type="submit">Enviar email y registrar</Button>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </form>;
}
