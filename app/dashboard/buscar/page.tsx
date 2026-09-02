import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cliente = { cli_id: number; cli_nombre?: string | null; cli_apellido?: string | null; cli_celu?: string | null; cli_tel1?: string | null; cli_mail?: string | null };
type Paciente = { pac_id: number; pac_nombre?: string | null; pac_apellido?: string | null; pac_raz_nombre?: string | null; pac_raz_siglas?: string | null; pac_cliente: number; pac_microchip?: string | null };

const clean = (value?: string | null) => value?.trim() || "—";
const ownerName = (owner?: Cliente) => owner ? `${clean(owner.cli_apellido)}, ${clean(owner.cli_nombre)}`.replace(/^—, /, "") : "Dueño no encontrado";

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const safeTerm = term.replace(/[,%()]/g, " ");
  const numericId = /^\d+$/.test(term) ? Number(term) : null;
  const supabase = createAdminClient();

  const [clientResult, directPatientResult] = term
    ? await Promise.all([
      supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido,cli_celu,cli_tel1,cli_mail").or(`${numericId !== null ? `cli_id.eq.${numericId},` : ""}cli_nombre.ilike.%${safeTerm}%,cli_apellido.ilike.%${safeTerm}%,cli_celu.ilike.%${safeTerm}%,cli_tel1.ilike.%${safeTerm}%,cli_mail.ilike.%${safeTerm}%`).limit(20),
      supabase.from("pacientes").select("pac_id,pac_nombre,pac_apellido,pac_raz_nombre,pac_raz_siglas,pac_cliente,pac_microchip").or(`${numericId !== null ? `pac_id.eq.${numericId},pac_cliente.eq.${numericId},` : ""}pac_nombre.ilike.%${safeTerm}%,pac_apellido.ilike.%${safeTerm}%,pac_microchip.ilike.%${safeTerm}%`).limit(30),
    ])
    : [{ data: [] as Cliente[] }, { data: [] as Paciente[] }];

  const clients = (clientResult.data ?? []) as Cliente[];
  const { data: consultations } = term
    ? await supabase.from("consultas_nuevas").select("id,paciente_id,fecha,titulo,detalle,profesional").or(`titulo.ilike.%${safeTerm}%,detalle.ilike.%${safeTerm}%,profesional.ilike.%${safeTerm}%`).order("fecha", { ascending: false }).limit(20)
    : { data: [] as { id: number; paciente_id: number; fecha?: string | null; titulo?: string | null; detalle?: string | null; profesional?: string | null }[] };
  const ownerIds = clients.map((client) => Number(client.cli_id)).filter(Number.isFinite);
  const petsOfOwnersResult = ownerIds.length
    ? await supabase.from("pacientes").select("pac_id,pac_nombre,pac_apellido,pac_raz_nombre,pac_raz_siglas,pac_cliente,pac_microchip").in("pac_cliente", ownerIds).order("pac_nombre").limit(50)
    : { data: [] as Paciente[] };
  const patientMap = new Map<number, Paciente>();
  [...((directPatientResult.data ?? []) as Paciente[]), ...((petsOfOwnersResult.data ?? []) as Paciente[])].forEach((patient) => patientMap.set(Number(patient.pac_id), patient));
  const patients = [...patientMap.values()].slice(0, 50);
  const allOwnerIds = [...new Set([...ownerIds, ...patients.map((patient) => Number(patient.pac_cliente))])];
  const missingOwnerIds = allOwnerIds.filter((id) => !ownerIds.includes(id));
  const missingOwners = missingOwnerIds.length
    ? await supabase.from("clientes").select("cli_id,cli_nombre,cli_apellido,cli_celu,cli_tel1,cli_mail").in("cli_id", missingOwnerIds)
    : { data: [] as Cliente[] };
  const owners = new Map<number, Cliente>([...clients, ...((missingOwners.data ?? []) as Cliente[])].map((owner) => [Number(owner.cli_id), owner]));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-800">🔎 Buscador global</h1>
      <p className="mb-5 text-sm text-slate-500">Buscá por dueño, mascota, teléfono, email, microchip o ID. Si encontrás un dueño, también aparecen sus mascotas.</p>
      <form className="flex gap-2" method="GET">
        <Input name="q" defaultValue={term} placeholder="Ej.: Samantha, 11 4448…, microchip…" autoFocus />
        <Button type="submit">Buscar</Button>
      </form>

      {term && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-700">👥 Clientes ({clients.length})</h2>
            <div className="space-y-2">
              {clients.map((client) => (
                <Link key={client.cli_id} href={`/dashboard/clientes/${client.cli_id}`} className="block rounded-xl border bg-white p-4 shadow-sm hover:border-slate-400">
                  <div className="font-medium text-slate-800">{ownerName(client)}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{clean(client.cli_celu) !== "—" ? clean(client.cli_celu) : clean(client.cli_tel1) !== "—" ? clean(client.cli_tel1) : clean(client.cli_mail) !== "—" ? clean(client.cli_mail) : "Sin contacto"}</div>
                  <div className="mt-2 text-xs font-medium text-blue-700">Abrir ficha y mascotas →</div>
                </Link>
              ))}
              {!clients.length && <p className="rounded-xl border bg-white p-4 text-sm text-slate-400">Sin clientes.</p>}
            </div>
          </section>

          <section className="md:col-span-2">
            <h2 className="mb-3 text-base font-semibold text-slate-700">🩺 Consultas nuevas ({consultations?.length ?? 0})</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {consultations?.map((consultation) => (
                <Link key={consultation.id} href={`/dashboard/pacientes/${consultation.paciente_id}`} className="block rounded-xl border bg-white p-4 shadow-sm hover:border-slate-400">
                  <div className="font-medium text-slate-800">{consultation.titulo?.trim() || "Consulta"} · {consultation.fecha?.trim() || "Sin fecha"}</div>
                  <div className="mt-1 text-xs text-slate-500">🐾 {patients.find((patient) => Number(patient.pac_id) === Number(consultation.paciente_id))?.pac_nombre?.trim() || `Paciente #${consultation.paciente_id}`} · Dr/a: {consultation.profesional?.trim() || "—"}</div>
                  {consultation.detalle?.trim() && <p className="mt-2 line-clamp-2 text-xs text-slate-600">{consultation.detalle.trim()}</p>}
                </Link>
              ))}
              {!consultations?.length && <p className="rounded-xl border bg-white p-4 text-sm text-slate-400">Sin consultas nuevas.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-700">🐾 Pacientes ({patients.length})</h2>
            <div className="space-y-2">
              {patients.map((patient) => {
                const owner = owners.get(Number(patient.pac_cliente));
                return (
                  <article key={patient.pac_id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <Link href={`/dashboard/pacientes/${patient.pac_id}`} className="block hover:text-blue-700">
                      <div className="font-medium text-slate-800">{patient.pac_raz_siglas?.trim() === "F" ? "🐱" : "🐾"} {clean(patient.pac_nombre)} {patient.pac_apellido?.trim()}</div>
                      <div className="mt-1 text-xs text-slate-500">{clean(patient.pac_raz_nombre)}{patient.pac_microchip?.trim() ? ` · Chip: ${patient.pac_microchip.trim()}` : ""}</div>
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2 text-xs">
                      <span className="min-w-0 truncate text-slate-500">Dueño: {ownerName(owner)}</span>
                      {owner && <Link href={`/dashboard/clientes/${owner.cli_id}`} className="shrink-0 font-medium text-blue-700 hover:underline">Ver dueño</Link>}
                    </div>
                  </article>
                );
              })}
              {!patients.length && <p className="rounded-xl border bg-white p-4 text-sm text-slate-400">Sin mascotas.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
