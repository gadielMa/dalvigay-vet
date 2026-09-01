"use client";

import { Button } from "@/components/ui/button";

export function PrintPatientButton() {
  return <Button type="button" variant="outline" size="sm" data-print-hidden onClick={() => window.print()}>🖨️ Imprimir ficha</Button>;
}
