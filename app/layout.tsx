import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const metadataBase = new URL(
  process.env.APP_URL ?? "http://localhost:3000",
);

export const metadata: Metadata = {
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
        url: "/og.png",
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
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${publicSans.variable} antialiased`}>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
