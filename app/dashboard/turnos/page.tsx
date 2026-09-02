import { createAdminClient } from "@/lib/supabase/admin";
import { TurnosPanel } from "./TurnosPanel";
import { argentinaDate } from "@/lib/date";

const iso = (date: Date) => argentinaDate(date);
function monday(value: string) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return iso(date); }
function sunday(start: string) { const date = new Date(`${start}T12:00:00`); date.setDate(date.getDate() + 6); return iso(date); }

export default async function TurnosPage({ searchParams }: { searchParams: Promise<{ cliente_id?: string; paciente_id?: string; week?: string }> }) {
  const { cliente_id = "", paciente_id = "", week = "" } = await searchParams;
  const supabase = createAdminClient();
  const today = iso(new Date());
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(week) ? monday(week) : monday(today);
  const { data: turnos } = await supabase.from("turnos").select("*").gte("fecha", weekStart).lte("fecha", sunday(weekStart)).order("fecha").order("hora");
  const rows = turnos ?? [];
  const clientIds = [...new Set(rows.map((turn) => Number(turn.cliente_id)).filter(Number.isFinite))];
  const patientIds = [...new Set(rows.map((turn) => Number(turn.paciente_id)).filter(Number.isFinite))];
  const [{ data: clientes }, { data: pacientes }] = await Promise.all([
    clientIds.length ? supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", clientIds) : Promise.resolve({ data: [] }),
    patientIds.length ? supabase.from("pacientes").select("pac_id,pac_nombre,pac_cliente").in("pac_id", patientIds) : Promise.resolve({ data: [] }),
  ]);
  const initialClientId = Number(cliente_id);
  const initialPatientId = Number(paciente_id);
  const [{ data: initialClient }, { data: initialPets }, { data: initialPatient }] = await Promise.all([
    Number.isInteger(initialClientId) ? supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").eq("cli_id", initialClientId).maybeSingle() : Promise.resolve({ data: null }),
    Number.isInteger(initialClientId) ? supabase.from("pacientes").select("pac_id,pac_nombre,pac_cliente,pac_raz_nombre").eq("pac_cliente", initialClientId).order("pac_nombre").limit(100) : Promise.resolve({ data: [] }),
    Number.isInteger(initialClientId) && Number.isInteger(initialPatientId) ? supabase.from("pacientes").select("pac_id").eq("pac_id", initialPatientId).eq("pac_cliente", initialClientId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return <TurnosPanel turnos={rows} clientes={clientes ?? []} pacientes={pacientes ?? []} today={today} initialWeek={weekStart} initialClient={initialClient} initialPets={initialPets ?? []} initialPatientId={initialPatient?.pac_id} />;
}
