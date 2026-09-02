import { createAdminClient } from "@/lib/supabase/admin";
import { TurnosPanel } from "./TurnosPanel";

export default async function TurnosPage({ searchParams }: { searchParams: Promise<{ cliente_id?: string; paciente_id?: string }> }) {
  const { cliente_id = "", paciente_id = "" } = await searchParams;
  const supabase = createAdminClient();
  const { data: turnos } = await supabase.from("turnos").select("*").order("fecha").order("hora").limit(200);
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
  return <TurnosPanel turnos={rows} clientes={clientes ?? []} pacientes={pacientes ?? []} today={new Date().toISOString().slice(0, 10)} initialClient={initialClient} initialPets={initialPets ?? []} initialPatientId={initialPatient?.pac_id} />;
}
