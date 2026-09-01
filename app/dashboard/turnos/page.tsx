import { createAdminClient } from "@/lib/supabase/admin";
import { TurnosPanel } from "./TurnosPanel";

export default async function TurnosPage() {
  const supabase = createAdminClient();
  const { data: turnos } = await supabase.from("turnos").select("*").order("fecha").order("hora").limit(200);
  const rows = turnos ?? [];
  const clientIds = [...new Set(rows.map((turn) => Number(turn.cliente_id)).filter(Number.isFinite))];
  const patientIds = [...new Set(rows.map((turn) => Number(turn.paciente_id)).filter(Number.isFinite))];
  const [{ data: clientes }, { data: pacientes }] = await Promise.all([
    clientIds.length ? supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").in("cli_id", clientIds) : Promise.resolve({ data: [] }),
    patientIds.length ? supabase.from("pacientes").select("pac_id,pac_nombre,pac_cliente").in("pac_id", patientIds) : Promise.resolve({ data: [] }),
  ]);
  return <TurnosPanel turnos={rows} clientes={clientes ?? []} pacientes={pacientes ?? []} today={new Date().toISOString().slice(0, 10)} />;
}
