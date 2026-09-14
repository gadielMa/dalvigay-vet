import { NextResponse } from "next/server";
import { requireSession } from "@/lib/operacion";
import { createAdminClient } from "@/lib/supabase/admin";
export async function DELETE(_req: Request,{params}:{params:Promise<{id:string}>}){try{await requireSession();const id=Number((await params).id);if(!Number.isInteger(id))return NextResponse.json({error:"ID inválido"},{status:400});const{error}=await createAdminClient().from("vacunas").delete().eq("vac_id",id);if(error)throw error;return NextResponse.json({ok:true});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo eliminar la vacuna"},{status:500});}}
