"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cliente = { cli_id: number; cli_nombre?: string; cli_apellido?: string };
type Paciente = { pac_id: number; pac_nombre?: string; pac_cliente?: number };
type Turno = { id: number; fecha: string; hora: string; cliente_id: number; paciente_id: number; motivo: string; estado: string };

const iso = (date: Date) => date.toISOString().slice(0, 10);
const clean = (value: unknown) => String(value ?? "").trim();
function monday(value: string) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return iso(date); }
function days(start: string) { return Array.from({ length: 7 }, (_, index) => { const date = new Date(`${start}T12:00:00`); date.setDate(date.getDate() + index); return iso(date); }); }
function shift(start: string, amount: number) { const date = new Date(`${start}T12:00:00`); date.setDate(date.getDate() + amount); return iso(date); }
function label(date: string) { return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`)); }

export function TurnosPanel({ turnos, clientes, pacientes, today }: { turnos: Turno[]; clientes: Cliente[]; pacientes: Paciente[]; today: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [week, setWeek] = useState(monday(today));
  const [clienteId, setClienteId] = useState("");
  const weekDays = useMemo(() => days(week), [week]);
  const pets = clienteId ? pacientes.filter((patient) => Number(patient.pac_cliente) === Number(clienteId)) : pacientes;
  const owner = (id: number) => { const client = clientes.find((item) => item.cli_id === id); return `${clean(client?.cli_apellido)} ${clean(client?.cli_nombre)}`.trim() || `Cliente #${id}`; };
  const pet = (id: number) => clean(pacientes.find((item) => item.pac_id === id)?.pac_nombre) || `Mascota #${id}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/turnos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    if (!response.ok) return setError((await response.json()).error ?? "No se pudo guardar");
    event.currentTarget.reset(); setClienteId(""); router.refresh();
  }

  async function change(id: number, estado: string) {
    const response = await fetch(`/api/turnos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) });
    if (!response.ok) setError((await response.json()).error ?? "No se pudo actualizar");
    router.refresh();
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-semibold text-slate-800">Turnos</h1><p className="text-sm text-slate-500">Agenda semanal compartida.</p></div><div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={() => setWeek(shift(week, -7))}>← Semana</Button><Input type="date" value={week} onChange={(event) => setWeek(monday(event.target.value))} className="w-auto"/><Button variant="outline" size="sm" onClick={() => setWeek(monday(today))}>Hoy</Button><Button variant="outline" size="sm" onClick={() => setWeek(shift(week, 7))}>Semana →</Button></div></div>
    <form onSubmit={submit} className="grid min-w-0 gap-2 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"><Input name="fecha" type="date" defaultValue={today} required/><Input name="hora" type="time" required/><select name="cliente_id" value={clienteId} onChange={(event) => setClienteId(event.target.value)} required className="h-9 min-w-0 rounded-lg border px-2 text-sm"><option value="">Dueño</option>{clientes.map((client) => <option key={client.cli_id} value={client.cli_id}>{clean(client.cli_apellido)} {clean(client.cli_nombre)}</option>)}</select><select name="paciente_id" required className="h-9 min-w-0 rounded-lg border px-2 text-sm"><option value="">Mascota</option>{pets.map((patient) => <option key={patient.pac_id} value={patient.pac_id}>{clean(patient.pac_nombre)}</option>)}</select><Input name="motivo" placeholder="Motivo" required/><Input name="notas" placeholder="Notas (opcional)"/><Button type="submit">Agregar turno</Button>{error && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">{error}</p>}</form>
    <div className="overflow-x-auto rounded-xl border bg-slate-100 p-2 [-webkit-overflow-scrolling:touch]"><div className="grid min-w-[760px] grid-cols-7 gap-2">{weekDays.map((day) => { const dayTurns = turnos.filter((turn) => turn.fecha === day); return <div key={day} className="min-h-72 rounded-lg bg-white p-2"><div className={`mb-2 border-b pb-2 text-center text-xs font-semibold ${day === today ? "text-blue-700" : "text-slate-600"}`}>{label(day)}</div><div className="space-y-2">{dayTurns.map((turn) => <div key={turn.id} className={`rounded-md border p-2 text-xs ${turn.estado === "cancelado" ? "bg-slate-50 opacity-60" : turn.estado === "atendido" ? "border-green-200 bg-green-50" : "bg-white"}`}><div className="font-semibold text-slate-800">{String(turn.hora).slice(0, 5)} · {pet(turn.paciente_id)}</div><div className="mt-1 text-slate-600">{owner(turn.cliente_id)}</div><div className="mt-1 text-slate-500">{turn.motivo}</div><select value={turn.estado} onChange={(event) => change(turn.id, event.target.value)} className="mt-2 w-full rounded border bg-white px-1 py-1 text-[11px]"><option>pendiente</option><option>confirmado</option><option>atendido</option><option>cancelado</option></select></div>)}{!dayTurns.length && <p className="py-4 text-center text-xs text-slate-300">Sin turnos</p>}</div></div>; })}</div></div>
  </div>;
}
