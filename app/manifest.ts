import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dalvigay Veterinaria",
    short_name: "Dalvigay",
    description: "Sistema de gestión de la Veterinaria Dalvigay",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1e293b",
    lang: "es-AR",
  };
}
