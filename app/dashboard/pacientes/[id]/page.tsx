import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ESPECIE: Record<string, string> = { C: "🐶 Canino", F: "🐱 Felino", AVE: "🐦 Ave" };

export default async function PacienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: paciente },
    { data: hc },
    { data: vacunas },
    { data: ecografias },
    { data: rayos },
    { data: hemogramas },
  ] = await Promise.all([
    supabase.from("pacientes").select("*").eq("pac_id", id).single(),
    supabase.from("hcren").select("hcr_id,hcr_fecha_hc,hcr_titulo,hcr_peso,hcr_temp,hcr_detalle,hcr_dr").eq("hcr_hcc_idpaciente", id).order("hcr_fecha_hc", { ascending: false }),
    supabase.from("vacunas").select("vac_id,vac_fvisita,vac_fproxima,vac_marca,vac_clase,vac_dr,vac_volvio").eq("vac_idpaciente", id).order("vac_fvisita", { ascending: false }),
    supabase.from("ecografias").select("eco_id,eco_fecha,eco_estudio,eco_diag,eco_dr").eq("eco_idpaciente", id).order("eco_fecha", { ascending: false }),
    supabase.from("rayos").select("ray_id,ray_fvisita,ray_estudio,ray_diag,ray_dr").eq("ray_idpaciente", id).order("ray_fvisita", { ascending: false }),
    supabase.from("hemogramas").select("hem_id,hem_fvisita,hem_dr,hem_leucocitos,hem_hemoglobina,hem_hematocritos,hem_plaquetas").eq("hem_idpaciente", id).order("hem_fvisita", { ascending: false }),
  ]);

  if (!paciente) notFound();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("cli_nombre,cli_apellido,cli_celu,cli_mail,cli_tel1")
    .eq("cli_id", paciente.pac_cliente)
    .single();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/dashboard/pacientes">
          <Button variant="outline" size="sm">← Volver</Button>
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">
          {ESPECIE[paciente.pac_raz_siglas?.trim()] ?? "🐾"} {paciente.pac_nombre?.trim()}
        </h1>
      </div>

      {/* Ficha */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Datos del paciente</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Nombre" value={paciente.pac_nombre?.trim()} />
            <Row label="Raza" value={paciente.pac_raz_nombre?.trim()} />
            <Row label="Sexo" value={paciente.pac_sexo === "M" ? "♂ Macho" : paciente.pac_sexo === "H" ? "♀ Hembra" : paciente.pac_sexo?.trim()} />
            <Row label="Nacimiento" value={paciente.pac_fecha_nac?.trim()} />
            <Row label="Color" value={paciente.pac_color?.trim()} />
            <Row label="Peso" value={paciente.pac_peso?.trim() ? `${paciente.pac_peso.trim()} kg` : undefined} />
            <Row label="Microchip" value={paciente.pac_microchip?.trim()} mono />
          </dl>
        </div>
        {cliente && (
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Dueño</h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Nombre" value={`${cliente.cli_nombre?.trim()} ${cliente.cli_apellido?.trim()}`} />
              <Row label="Celular" value={cliente.cli_celu?.trim()} />
              <Row label="Teléfono" value={cliente.cli_tel1?.trim()} />
              <Row label="Email" value={cliente.cli_mail?.trim() !== "0" ? cliente.cli_mail?.trim() : undefined} />
            </dl>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { icon: "📋", count: hc?.length ?? 0, label: "consultas" },
          { icon: "💉", count: vacunas?.length ?? 0, label: "vacunas" },
          { icon: "🔬", count: ecografias?.length ?? 0, label: "ecografías" },
          { icon: "☢️", count: rayos?.length ?? 0, label: "rayos" },
          { icon: "🩸", count: hemogramas?.length ?? 0, label: "hemogramas" },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2 text-sm shadow-sm">
            <span>{s.icon}</span>
            <span className="font-semibold text-slate-800">{s.count}</span>
            <span className="text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Historia Clínica */}
      {hc && hc.length > 0 && (
        <Section title="📋 Historia Clínica" count={hc.length}>
          <div className="space-y-3">
            {hc.map((r) => (
              <div key={r.hcr_id} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-slate-700">
                    {r.hcr_fecha_hc?.trim() || "Sin fecha"}
                    {r.hcr_titulo?.trim() ? ` · ${r.hcr_titulo.trim()}` : ""}
                  </span>
                  <div className="flex gap-3 text-xs text-slate-400">
                    {r.hcr_peso?.trim() && r.hcr_peso !== "0" && <span>⚖️ {r.hcr_peso.trim()} kg</span>}
                    {r.hcr_temp?.trim() && r.hcr_temp !== "0" && <span>🌡️ {r.hcr_temp.trim()}°C</span>}
                    {r.hcr_dr?.trim() && <span>Dr/a: {r.hcr_dr.trim()}</span>}
                  </div>
                </div>
                {r.hcr_detalle?.trim() && (
                  <div
                    className="text-xs text-slate-600 leading-relaxed mt-2"
                    dangerouslySetInnerHTML={{
                      __html: r.hcr_detalle.trim().replace(/<script[^>]*>.*?<\/script>/gi, ""),
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Vacunas */}
      {vacunas && vacunas.length > 0 && (
        <Section title="💉 Vacunas" count={vacunas.length}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-600">Fecha</th>
                  <th className="px-3 py-2 text-left text-slate-600">Marca</th>
                  <th className="px-3 py-2 text-left text-slate-600">Clase</th>
                  <th className="px-3 py-2 text-left text-slate-600">Próxima</th>
                  <th className="px-3 py-2 text-left text-slate-600">Médico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vacunas.map((v) => (
                  <tr key={v.vac_id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600">{v.vac_fvisita?.trim() || "—"}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{v.vac_marca?.trim() || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{v.vac_clase?.trim() || "—"}</td>
                    <td className="px-3 py-2">
                      {v.vac_fproxima?.trim()
                        ? <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{v.vac_fproxima.trim()}</span>
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{v.vac_dr?.trim() || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Ecografías */}
      {ecografias && ecografias.length > 0 && (
        <Section title="🔬 Ecografías" count={ecografias.length}>
          <div className="space-y-2">
            {ecografias.map((e) => (
              <div key={e.eco_id} className="bg-white rounded-xl border p-3 shadow-sm">
                <div className="text-xs font-medium text-slate-700 mb-1">
                  {e.eco_fecha?.trim() || "Sin fecha"} · {e.eco_estudio?.trim() || "Ecografía"} · Dr/a: {e.eco_dr?.trim() || "—"}
                </div>
                {e.eco_diag?.trim() && (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{e.eco_diag.trim()}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Rayos */}
      {rayos && rayos.length > 0 && (
        <Section title="☢️ Rayos X" count={rayos.length}>
          <div className="space-y-2">
            {rayos.map((r) => (
              <div key={r.ray_id} className="bg-white rounded-xl border p-3 shadow-sm">
                <div className="text-xs font-medium text-slate-700 mb-1">
                  {r.ray_fvisita?.trim() || "Sin fecha"} · {r.ray_estudio?.trim() || "Rayos"} · Dr/a: {r.ray_dr?.trim() || "—"}
                </div>
                {r.ray_diag?.trim() && (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{r.ray_diag.trim()}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Hemogramas */}
      {hemogramas && hemogramas.length > 0 && (
        <Section title="🩸 Hemogramas" count={hemogramas.length}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-600">Fecha</th>
                  <th className="px-3 py-2 text-left text-slate-600">Leucocitos</th>
                  <th className="px-3 py-2 text-left text-slate-600">Hemoglobina</th>
                  <th className="px-3 py-2 text-left text-slate-600">Hematocrito</th>
                  <th className="px-3 py-2 text-left text-slate-600">Plaquetas</th>
                  <th className="px-3 py-2 text-left text-slate-600">Médico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hemogramas.map((h) => (
                  <tr key={h.hem_id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600">{h.hem_fvisita?.trim() || "—"}</td>
                    <td className="px-3 py-2">{h.hem_leucocitos?.trim() || "—"}</td>
                    <td className="px-3 py-2">{h.hem_hemoglobina?.trim() || "—"}</td>
                    <td className="px-3 py-2">{h.hem_hematocritos?.trim() || "—"}</td>
                    <td className="px-3 py-2">{h.hem_plaquetas?.trim() || "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{h.hem_dr?.trim() || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value || value === "0") return null;
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500 w-24 shrink-0">{label}</dt>
      <dd className={`text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">
        {title} <span className="text-slate-400 font-normal">({count})</span>
      </h2>
      {children}
    </div>
  );
}
