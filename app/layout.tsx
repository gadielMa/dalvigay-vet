import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dalvigay Veterinaria",
  description: "Sistema de gestión de la Veterinaria Dalvigay",
  applicationName: "Dalvigay Veterinaria",
  appleWebApp: { capable: true, title: "Dalvigay" },
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1e293b" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ServiceWorkerRegister />{children}</body>
    </html>
  );
}
