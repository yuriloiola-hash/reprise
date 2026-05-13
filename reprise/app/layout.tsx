import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/navigation/Sidebar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { DeviceDetector } from "@/components/DeviceDetector";

// IBM Plex Sans: fonte corporativa, profissional e discreta para corpo de texto
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Montserrat: fonte de destaque para títulos, branding e UI de alto impacto
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "REPrise - Inteligência em Campo",
  description: "CRM de alta performance e Business Intelligence para Representantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} ${montserrat.variable} antialiased bg-brand-bg text-brand-text font-sans`}>
        <DeviceDetector />
        <div className="flex min-h-screen">
          {/* Sidebar para Desktop */}
          <Sidebar />
          
          {/* Conteúdo Principal */}
          <main className="flex-1 md:ml-[240px] pb-24 md:pb-0">
            {children}
          </main>

          {/* Navegação Inferior para Mobile */}
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
