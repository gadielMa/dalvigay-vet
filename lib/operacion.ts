import { getSession } from "@/lib/auth";

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");
  return session;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
