import type { Metadata } from "next";
import { FranceSolidaireApp } from "@/components/france-solidaire-app";
import { listPublicAnnouncements } from "@/lib/announcement-repository";
import { seedAnnouncements } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "L’entraide près de chez vous — France Solidaire",
  },
  description:
    "Demandez un coup de main ou proposez votre aide simplement, gratuitement et près de chez vous.",
};

export default async function Home() {
  let announcements = seedAnnouncements;
  let demoMode = true;
  try {
    const result = await listPublicAnnouncements({ limit: 50 });
    announcements = result.announcements;
    demoMode = false;
  } catch {}
  return (
    <FranceSolidaireApp
      initialAnnouncements={announcements}
      demoMode={demoMode}
    />
  );
}
