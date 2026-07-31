import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: "France Solidaire",
      template: "%s — France Solidaire",
    },
    description:
      "La plateforme d’entraide qui rapproche les besoins des personnes prêtes à aider.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      title: "France Solidaire — Un coup de main peut tout changer",
      description:
        "Demandez de l’aide ou proposez la vôtre, simplement et près de chez vous.",
      images: [
        {
          url: socialImage,
          width: 1731,
          height: 909,
          alt: "France Solidaire — Ici, un coup de main peut tout changer.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "France Solidaire",
      description:
        "Demandez de l’aide ou proposez la vôtre, simplement et près de chez vous.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
