import { createAdminClient } from "@/lib/supabase/admin";
import { TurnosPanel } from "./TurnosPanel";

export default async function TurnosPage() {
  const supabase = createAdminClient();
  const [{ data: turnos }, { data: clientes }, { data: pacientes }] = await Promise.all([
    supabase.from("turnos").select("*").order("fecha").order("hora").limit(200),
    supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido").order("cli_apellido").limit(10000),
    supabase.from("pacientes").select("pac_id,pac_nombre,pac_cliente").order("pac_nombre").limit(10000),
  ]);
  return <TurnosPanel turnos={turnos ?? []} clientes={clientes ?? []} pacientes={pacientes ?? []} today={new Date().toISOString().slice(0, 10)} />;
}
