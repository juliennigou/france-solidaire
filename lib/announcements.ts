export type AnnouncementKind = "need" | "offer";

export type Announcement = {
  id: string;
  kind: AnnouncementKind;
  category: string;
  title: string;
  description: string;
  firstName: string;
  commune: string;
  availability: string;
  status: "active" | "matched" | "closed";
  createdAt: number;
};

export const categories = [
  "Transport",
  "Matériel",
  "Nettoyage",
  "Travaux",
  "Hébergement",
  "Animaux",
  "Démarches",
  "Autre",
] as const;

export const seedAnnouncements: Announcement[] = [
  {
    id: "seed-1",
    kind: "need",
    category: "Transport",
    title: "Une remorque pour déplacer des meubles",
    description:
      "Nous cherchons une personne avec une remorque pour mettre quelques meubles à l’abri samedi matin. Deux personnes seront déjà sur place pour aider.",
    firstName: "Martine",
    commune: "Le Temple",
    availability: "Samedi matin",
    status: "active",
    createdAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: "seed-2",
    kind: "offer",
    category: "Travaux",
    title: "Électricien disponible pour conseiller",
    description:
      "Je peux venir vérifier une installation, aider à établir la liste des travaux et expliquer les priorités avant l’intervention d’une entreprise.",
    firstName: "Lucas",
    commune: "Bordeaux",
    availability: "Deux week-ends en août",
    status: "active",
    createdAt: Date.now() - 1000 * 60 * 80,
  },
  {
    id: "seed-3",
    kind: "need",
    category: "Nettoyage",
    title: "Coup de main pour débarrasser une pièce",
    description:
      "Nous aurions besoin de trois ou quatre personnes pour trier et déplacer ce qui peut encore être récupéré. Gants et sacs déjà disponibles.",
    firstName: "Nadia",
    commune: "Sainte-Hélène",
    availability: "Cette semaine",
    status: "active",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: "seed-4",
    kind: "offer",
    category: "Animaux",
    title: "Accueil temporaire pour deux chiens",
    description:
      "Jardin clôturé et présence à la maison. Je peux accueillir deux chiens sociables pendant quelques jours, nourriture comprise.",
    firstName: "Anaïs",
    commune: "Mérignac",
    availability: "Disponible dès maintenant",
    status: "active",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: "seed-5",
    kind: "need",
    category: "Matériel",
    title: "Recherche petit électroménager",
    description:
      "Pour un logement temporaire, nous recherchons une bouilloire, un micro-ondes et quelques ustensiles de cuisine. Nous pouvons nous déplacer.",
    firstName: "Famille B.",
    commune: "Saumos",
    availability: "Dans les prochains jours",
    status: "active",
    createdAt: Date.now() - 1000 * 60 * 60 * 25,
  },
  {
    id: "seed-6",
    kind: "offer",
    category: "Transport",
    title: "Fourgon et deux bras disponibles",
    description:
      "Nous avons un fourgon utilitaire et pouvons aider à transporter du mobilier ou du matériel autour du bassin.",
    firstName: "Jean & Chloé",
    commune: "Andernos-les-Bains",
    availability: "Vendredi et samedi",
    status: "active",
    createdAt: Date.now() - 1000 * 60 * 60 * 31,
  },
];
