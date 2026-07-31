import type { Metadata } from "next";
import { FranceSolidaireApp } from "@/components/france-solidaire-app";
import { seedAnnouncements } from "@/lib/announcements";

export const metadata: Metadata = {
  title: "France Solidaire — L’entraide près de chez vous",
  description:
    "Demandez un coup de main ou proposez votre aide simplement, gratuitement et près de chez vous.",
};

export default function Home() {
  return <FranceSolidaireApp initialAnnouncements={seedAnnouncements} />;
}
