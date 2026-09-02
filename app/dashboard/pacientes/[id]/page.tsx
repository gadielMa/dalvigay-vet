import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NuevaConsulta } from "./NuevaConsulta";
import { PacienteActions } from "./PacienteActions";
import { ClinicalAdditions } from "./ClinicalAdditions";
import { PrintPatientButton } from "./PrintPatientButton";

const ESPECIE: Record<string, string> = { C: "🐶 Canino", F: "🐱 Felino", AVE: "🐦 Ave" };

export default async function PacienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: paciente },
    { data: hc },
    { data: vacunas },
    { data: ecografias },
    { data: rayos },
    { data: hemogramas },
    { data: consultasNuevas },
    { data: orinas },
    { data: quimicas },
    { data: ectoendos },
    { data: electros },
    { data: estudios },
    { data: movimientos },
    { data: turnos },
  ] = await Promise.all([
    supabase.from("pacientes").select("*").eq("pac_id", id).single(),
    supabase.from("hcren").select("*").eq("hcr_hcc_idpaciente", id).order("hcr_fecha_hc", { ascending: false }),
    supabase.from("vacunas").select("*").eq("vac_idpaciente", id).order("vac_fvisita", { ascending: false }),
    supabase.from("ecografias").select("*").eq("eco_idpaciente", id).order("eco_fecha", { ascending: false }),
    supabase.from("rayos").select("*").eq("ray_idpaciente", id).order("ray_fvisita", { ascending: false }),
    supabase.from("hemogramas").select("*").eq("hem_idpaciente", id).order("hem_fvisita", { ascending: false }),
    supabase.from("consultas_nuevas").select("*").eq("paciente_id", id).order("fecha", { ascending: false }),
    supabase.from("orina").select("*").eq("ori_idpaciente", id).order("ori_fecha", { ascending: false }),
    supabase.from("quimicasang").select("*").eq("qs_idpaciente", id).order("qs_fvisita", { ascending: false }),
    supabase.from("ectoendo").select("*").eq("ee_idpaciente", id).order("ee_fvisita", { ascending: false }),
    supabase.from("electrocardio").select("*").eq("ele_idpaciente", id).order("ele_fecha", { ascending: false }),
    supabase.from("estudios").select("*").eq("est_idpaciente", id).order("est_fvisita", { ascending: false }),
    supabase.from("movimientos").select("*").eq("mov_idpaciente", id).order("mov_fecha", { ascending: false }).limit(100),
    supabase.from("turnos").select("id,fecha,hora,motivo,estado,notas").eq("paciente_id", Number(id)).gte("fecha", today).neq("estado", "cancelado").order("fecha").order("hora").limit(20),
  ]);

  if (!paciente) notFound();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("cli_id,cli_nombre,cli_apellido,cli_celu,cli_mail,cli_tel1")
    .eq("cli_id", paciente.pac_cliente)
    .single();

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Link href="/dashboard/pacientes">
          <Button variant="outline" size="sm">← Volver</Button>
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">
          {ESPECIE[paciente.pac_raz_siglas?.trim()] ?? "🐾"} {paciente.pac_nombre?.trim()}
        </h1>
        <PrintPatientButton />
      </div>

      {/* Ficha */}
      <div className="grid min-w-0 grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Datos del paciente</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Nombre" value={paciente.pac_nombre?.trim()} />
            <Row label="Apellido" value={paciente.pac_apellido?.trim()} />
            <Row label="Nombre completo" value={paciente.pac_nomcomp?.trim()} />
            <Row label="Raza" value={paciente.pac_raz_nombre?.trim()} />
            <Row label="Sexo" value={paciente.pac_sexo === "M" ? "♂ Macho" : paciente.pac_sexo === "H" ? "♀ Hembra" : paciente.pac_sexo?.trim()} />
            <Row label="Nacimiento" value={paciente.pac_fecha_nac?.trim()} />
            <Row label="Color" value={paciente.pac_color?.trim()} />
            <Row label="Peso" value={paciente.pac_peso?.trim() ? `${paciente.pac_peso.trim()} kg` : undefined} />
            <Row label="Microchip" value={paciente.pac_microchip?.trim()} mono />
            <Row label="Fecha de alta" value={paciente.pac_fecha_alta?.trim()} />
            <Row label="Última modificación" value={paciente.pac_ultima_modificacion?.trim()} />
            <Row label="Fecha de baja" value={paciente.pac_fecha_des?.trim()} />
          </dl>
          {paciente.pac_obser?.trim() && <div className="mt-4 border-t pt-3 text-sm"><div className="mb-1 text-xs font-medium text-slate-500">Observaciones</div><p className="whitespace-pre-wrap text-slate-700">{paciente.pac_obser.trim()}</p></div>}
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
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              <Link href={`/dashboard/clientes/${paciente.pac_cliente}`}><Button variant="outline" size="sm">Ver ficha del dueño</Button></Link>
              {String(cliente.cli_celu || cliente.cli_tel1 || "").replace(/\D/g, "") && <a href={`https://wa.me/54${String(cliente.cli_celu || cliente.cli_tel1).replace(/\D/g, "").replace(/^0/, "").replace(/^15/, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white">WhatsApp</a>}
              {cliente.cli_mail?.trim() && cliente.cli_mail.trim() !== "0" && <Link href={`/dashboard/comunicaciones?cliente_id=${cliente.cli_id}`} className="inline-flex h-8 items-center rounded-md border bg-white px-3 text-xs font-medium text-slate-700">✉️ Redactar email</Link>}
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { icon: "📋", count: hc?.length ?? 0, label: "consultas", id: "historia-clinica" },
          { icon: "💉", count: vacunas?.length ?? 0, label: "vacunas", id: "vacunas" },
          { icon: "🔬", count: ecografias?.length ?? 0, label: "ecografías", id: "ecografias" },
          { icon: "☢️", count: rayos?.length ?? 0, label: "rayos", id: "rayos-x" },
          { icon: "🩸", count: hemogramas?.length ?? 0, label: "hemogramas", id: "hemogramas" },
          { icon: "🧪", count: orinas?.length ?? 0, label: "orinas", id: "orina" },
          { icon: "⚗️", count: quimicas?.length ?? 0, label: "químicas", id: "quimica-sanguinea" },
          { icon: "🪱", count: ectoendos?.length ?? 0, label: "ecto/endo", id: "ecto-endoparasitarios" },
          { icon: "🗓️", count: turnos?.length ?? 0, label: "turnos próximos", id: "proximos-turnos" },
        ].map((s) => (
          <a key={s.label} href={`#${s.id}`} className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2 text-sm shadow-sm transition hover:border-blue-300 hover:bg-blue-50">
            <span>{s.icon}</span>
            <span className="font-semibold text-slate-800">{s.count}</span>
            <span className="text-slate-500">{s.label}</span>
          </a>
        ))}
      </div>

      <Timeline events={[
        ...eventos(hc ?? [], "📋", "Consulta", "hcr_fecha_hc", "hcr_titulo"),
        ...eventos(consultasNuevas ?? [], "🩺", "Consulta nueva", "fecha", "titulo"),
        ...eventos(vacunas ?? [], "💉", "Vacuna", "vac_fvisita", "vac_marca"),
        ...eventos(ecografias ?? [], "🔬", "Ecografía", "eco_fecha", "eco_estudio"),
        ...eventos(rayos ?? [], "☢️", "Rayos X", "ray_fvisita", "ray_estudio"),
        ...eventos(hemogramas ?? [], "🩸", "Hemograma", "hem_fvisita", "hem_dr"),
        ...eventos(orinas ?? [], "🧪", "Orina", "ori_fecha", "ori_dr"),
        ...eventos(quimicas ?? [], "⚗️", "Química", "qs_fvisita", "qs_dr"),
        ...eventos(ectoendos ?? [], "🪱", "Ecto / endo", "ee_fvisita", "ee_tipo"),
        ...eventos(electros ?? [], "❤️", "Electrocardiograma", "ele_fecha", "ele_estudio"),
        ...eventos(estudios ?? [], "🔎", "Estudio", "est_fvisita", "est_titulo"),
        ...eventos(turnos ?? [], "🗓️", "Turno", "fecha", "motivo"),
      ]} />

      {/* Historia Clínica */}
      {turnos && turnos.length > 0 && <Section title="🗓️ Próximos turnos" count={turnos.length}><div className="space-y-2">{turnos.map((turno) => <div key={turno.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-3 shadow-sm"><div><p className="text-sm font-medium text-slate-800">{turno.fecha} · {String(turno.hora).slice(0, 5)} · {turno.motivo}</p>{turno.notas && <p className="mt-1 text-xs text-slate-500">{turno.notas}</p>}</div><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{turno.estado}</span></div>)}</div><Link href="/dashboard/turnos" data-print-hidden className="mt-3 inline-block text-xs text-blue-700 hover:underline">Abrir agenda completa →</Link></Section>}
      <div data-print-hidden><Link href={`/dashboard/turnos?cliente_id=${paciente.pac_cliente}&paciente_id=${id}`}><Button variant="outline" size="sm">🗓️ Agendar turno</Button></Link><PacienteActions paciente={paciente} clienteId={Number(paciente.pac_cliente)} /><ClinicalAdditions pacienteId={Number(id)} /><NuevaConsulta pacienteId={Number(id)} /></div>
      {consultasNuevas && consultasNuevas.length > 0 && <Section title="🩺 Consultas nuevas" count={consultasNuevas.length}><div className="space-y-3">{consultasNuevas.map((r) => <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="text-xs font-medium text-slate-700">{r.fecha} · {r.titulo} · Dr/a: {r.profesional || "—"}</div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{r.detalle}</p>{r.tratamiento && <p className="mt-2 text-sm text-slate-600"><b>Indicaciones:</b> {r.tratamiento}</p>}{Array.isArray(r.adjuntos) && r.adjuntos.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{r.adjuntos.map((file: { path?: string; nombre?: string }, index: number) => file.path ? <a key={file.path} href={`/api/archivos?path=${encodeURIComponent(file.path)}`} target="_blank" className="rounded-md border px-2 py-1 text-xs text-blue-700 hover:bg-slate-50">📎 {file.nombre || `Adjunto ${index + 1}`}</a> : null)}</div>}</div>)}</div></Section>}
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
          <details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver todos los campos de las consultas históricas</summary><div className="mt-3"><RegistrosCompletos registros={hc} fecha="hcr_fecha_hc" titulo="hcr_titulo" /></div></details>
        </Section>
      )}

      {/* Vacunas */}
      {vacunas && vacunas.length > 0 && (
        <Section title="💉 Vacunas" count={vacunas.length}>
          <div className="space-y-2 md:hidden">{vacunas.map((v) => <article key={v.vac_id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{v.vac_marca?.trim() || "Vacuna"}</p><p className="mt-1 text-sm text-slate-600">{v.vac_clase?.trim() || "Clase sin registrar"}</p></div>{v.vac_fproxima?.trim() && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">Próxima: {v.vac_fproxima.trim()}</span>}</div><div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs text-slate-500"><span>Visita: {v.vac_fvisita?.trim() || "—"}</span><span>Serie: {v.vac_nserie?.trim() || "—"}</span><span>Importe: ${Number(v.vac_tot || 0).toLocaleString("es-AR")}</span><span>Dr/a: {v.vac_dr?.trim() || "—"}</span></div></article>)}</div>
          <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-600">Fecha</th>
                  <th className="px-3 py-2 text-left text-slate-600">Marca</th>
                  <th className="px-3 py-2 text-left text-slate-600">Clase</th>
                  <th className="px-3 py-2 text-left text-slate-600">Próxima</th>
                  <th className="px-3 py-2 text-left text-slate-600">Serie</th>
                  <th className="px-3 py-2 text-left text-slate-600">Importe</th>
                  <th className="px-3 py-2 text-left text-slate-600">Facturación</th>
                  <th className="px-3 py-2 text-left text-slate-600">Estado</th>
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
                    <td className="px-3 py-2 font-mono text-slate-600">{v.vac_nserie?.trim() || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">${Number(v.vac_tot || 0).toLocaleString("es-AR")} <span className="text-slate-400">({v.vac_cant || "0"} × ${v.vac_precio || "0"})</span></td>
                    <td className="px-3 py-2">{v.vac_facturar === "1" ? <span className="text-green-700">A facturar</span> : "—"}</td>
                    <td className="px-3 py-2">{v.vac_resaltado === "1" && <span className="mr-1 rounded bg-amber-100 px-1 text-amber-800">Destacada</span>}{v.vac_incluir === "1" ? <span className="text-green-700">Incluida</span> : <span className="text-slate-400">No incluida</span>}</td>
                    <td className="px-3 py-2 text-slate-500">{v.vac_dr?.trim() || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver número de serie, importes y todos los datos de vacunas</summary><div className="mt-3"><RegistrosCompletos registros={vacunas} fecha="vac_fvisita" titulo="vac_marca" /></div></details>
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
          <details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver datos completos de las ecografías</summary><div className="mt-3"><RegistrosCompletos registros={ecografias} fecha="eco_fecha" titulo="eco_estudio" /></div></details>
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
          <details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver datos completos de Rayos X</summary><div className="mt-3"><RegistrosCompletos registros={rayos} fecha="ray_fvisita" titulo="ray_estudio" /></div></details>
        </Section>
      )}

      {/* Hemogramas */}
      {hemogramas && hemogramas.length > 0 && (
        <Section title="🩸 Hemogramas" count={hemogramas.length}>
          <div className="space-y-2 md:hidden">{hemogramas.map((h) => <article key={h.hem_id} className="rounded-xl border bg-white p-4 shadow-sm"><p className="font-semibold text-slate-800">🩸 Hemograma · {h.hem_fvisita?.trim() || "Sin fecha"}</p><p className="mt-1 text-xs text-slate-500">Dr/a: {h.hem_dr?.trim() || "—"}</p><dl className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs"><div><dt className="text-slate-500">Leucocitos</dt><dd className="font-medium text-slate-800">{h.hem_leucocitos?.trim() || "—"}</dd></div><div><dt className="text-slate-500">Hemoglobina</dt><dd className="font-medium text-slate-800">{h.hem_hemoglobina?.trim() || "—"}</dd></div><div><dt className="text-slate-500">Hematocrito</dt><dd className="font-medium text-slate-800">{h.hem_hematocritos?.trim() || "—"}</dd></div><div><dt className="text-slate-500">Plaquetas</dt><dd className="font-medium text-slate-800">{h.hem_plaquetas?.trim() || "—"}</dd></div></dl></article>)}</div>
          <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
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
          <details className="mt-3 text-xs text-blue-700"><summary className="cursor-pointer">Ver hemogramas completos y observaciones</summary><div className="mt-3"><RegistrosCompletos registros={hemogramas} fecha="hem_fvisita" titulo="hem_dr" /></div></details>
        </Section>
      )}

      {orinas && orinas.length > 0 && <Section title="🧪 Análisis de orina" count={orinas.length}><RegistrosCompletos registros={orinas} fecha="ori_fecha" titulo="ori_dr" /></Section>}
      {quimicas && quimicas.length > 0 && <Section title="⚗️ Química sanguínea" count={quimicas.length}><RegistrosCompletos registros={quimicas} fecha="qs_fvisita" titulo="qs_dr" /></Section>}
      {ectoendos && ectoendos.length > 0 && <Section title="🪱 Ecto / endoparasitarios" count={ectoendos.length}><RegistrosCompletos registros={ectoendos} fecha="ee_fvisita" titulo="ee_tipo" /></Section>}
      {electros && electros.length > 0 && <Section title="❤️ Electrocardiogramas" count={electros.length}><RegistrosCompletos registros={electros} fecha="ele_fecha" titulo="ele_estudio" /></Section>}
      {estudios && estudios.length > 0 && <Section title="🔎 Estudios" count={estudios.length}><RegistrosCompletos registros={estudios} fecha="est_fvisita" titulo="est_titulo" /></Section>}
      {movimientos && movimientos.length > 0 && <Section title="🕒 Movimientos registrados" count={movimientos.length}><RegistrosCompletos registros={movimientos} fecha="mov_fecha" titulo="mov_persona" /></Section>}
    </div>
  );
}

function RegistrosCompletos({ registros, fecha, titulo }: { registros: Record<string, unknown>[]; fecha: string; titulo: string }) {
  return <div className="space-y-3">{registros.map((registro, index) => <details key={index} className="rounded-xl border bg-white p-4 shadow-sm"><summary className="cursor-pointer list-none text-sm font-medium text-slate-800"><span>{texto(registro[fecha]) || "Sin fecha"}</span><span className="text-slate-500"> · {texto(registro[titulo]) || "Ver resultados completos"}</span><span className="float-right text-xs text-blue-700">Ver detalle</span></summary><dl className="mt-4 grid gap-x-5 gap-y-3 border-t pt-4 text-sm sm:grid-cols-2">{Object.entries(registro).filter(([key, value]) => !/^(.*_id|.*_idpaciente)$/i.test(key) && texto(value)).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta(key)}</dt><dd className="break-words text-slate-800">{texto(value)}</dd></div>)}</dl></details>)}</div>;
}

function texto(value: unknown) { const result = String(value ?? "").trim(); return result === "0" ? "" : result; }
function etiqueta(key: string) { return key.replace(/^(ori|qs|ee|ele|est|mov|hem|vac|eco|ray)_/i, "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }

type Evento = { icono: string; tipo: string; fecha: string; detalle: string };
function eventos(registros: Record<string, unknown>[], icono: string, tipo: string, campoFecha: string, campoDetalle: string): Evento[] { return registros.map(registro => ({ icono, tipo, fecha: texto(registro[campoFecha]) || "Sin fecha", detalle: texto(registro[campoDetalle]) || "Sin detalle" })); }
function Timeline({ events }: { events: Evento[] }) { const ordered = events.sort((a,b) => fechaOrden(b.fecha) - fechaOrden(a.fecha)).slice(0,20); if(!ordered.length) return null; return <section className="mb-6"><h2 className="mb-3 text-sm font-semibold text-slate-700">🗓️ Cronología clínica reciente</h2><div className="space-y-2 border-l-2 border-slate-200 pl-4">{ordered.map((event,index)=><div key={`${event.tipo}-${event.fecha}-${index}`} className="relative rounded-lg border bg-white p-3 shadow-sm"><span className="absolute -left-7 top-3 rounded-full bg-slate-100 p-1 text-xs">{event.icono}</span><div className="text-xs font-medium text-slate-700">{event.fecha} · {event.tipo}</div><div className="mt-1 text-sm text-slate-600">{event.detalle}</div></div>)}</div></section>; }
function fechaOrden(value: string) { const time = Date.parse(value); if (!Number.isNaN(time)) return time; const parts=value.match(/(\d{1,2})\D(\d{1,2})\D(\d{2,4})/); if(parts){const year=Number(parts[3].length===2?`20${parts[3]}`:parts[3]);return new Date(year,Number(parts[1])-1,Number(parts[2])).getTime();} return 0; }

function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (!value || value === "0") return null;
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="text-slate-500 w-24 shrink-0">{label}</dt>
      <dd className={`min-w-0 break-words text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div id={sectionAnchor(title)} className="mb-6 scroll-mt-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">
        {title} <span className="text-slate-400 font-normal">({count})</span>
      </h2>
      {children}
    </div>
  );
}

function sectionAnchor(title: string) { return title.replace(/^[^A-Za-zÁÉÍÓÚáéíóúÑñ]+/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
