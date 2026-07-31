"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Construction,
  Dog,
  FileText,
  Flag,
  HandHeart,
  Handshake,
  Home,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  PackageOpen,
  Search,
  ShieldCheck,
  SprayCan,
  UserRound,
  UsersRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  categories,
  type Announcement,
  type AnnouncementKind,
} from "@/lib/announcements";
import { cn } from "@/lib/utils";

type Role = "helper" | "requester" | "both";
type FeedKind = AnnouncementKind | "all";

type PublishForm = {
  kind: AnnouncementKind;
  category: string;
  title: string;
  description: string;
  firstName: string;
  email: string;
  commune: string;
  availability: string;
  website: string;
};

const emptyPublishForm: PublishForm = {
  kind: "need",
  category: "Transport",
  title: "",
  description: "",
  firstName: "",
  email: "",
  commune: "",
  availability: "",
  website: "",
};

const categoryIcons: Record<string, LucideIcon> = {
  Transport: CarFront,
  Matériel: PackageOpen,
  Nettoyage: SprayCan,
  Travaux: Construction,
  Hébergement: Home,
  Animaux: Dog,
  Démarches: FileText,
  Autre: CircleHelp,
};

const kindLabels: Record<AnnouncementKind, string> = {
  need: "Besoin d’aide",
  offer: "Propose son aide",
};

const feedFilters: Array<{ value: FeedKind; label: string }> = [
  { value: "all", label: "Tout afficher" },
  { value: "need", label: "Besoins d’aide" },
  { value: "offer", label: "Propositions d’aide" },
];

const safetyItems: Array<{ label: string; text: string; icon: LucideIcon }> = [
  {
    label: "Votre adresse reste privée",
    text: "Seule la commune est affichée sur une annonce publique.",
    icon: MapPin,
  },
  {
    label: "Vos coordonnées ne sont jamais publiées",
    text: "L’email n’est transmis qu’à la personne que vous contactez.",
    icon: Mail,
  },
  {
    label: "Chaque annonce peut être signalée",
    text: "Une annonce signalée plusieurs fois est masquée puis examinée.",
    icon: Flag,
  },
  {
    label: "Aucune intervention dangereuse",
    text: "Les travaux à risque relèvent d’un professionnel assuré.",
    icon: Wrench,
  },
];

const steps = [
  {
    number: "1",
    title: "Décrivez votre situation",
    text: "Un besoin ou une proposition, une commune, un moment qui vous convient. Deux minutes suffisent.",
  },
  {
    number: "2",
    title: "Trouvez la bonne personne",
    text: "Les annonces sont classées par type d’aide et par commune. Aucun compte n’est nécessaire pour les consulter.",
  },
  {
    number: "3",
    title: "Organisez-vous librement",
    text: "Vous échangez par email, vous convenez des détails, puis vous fermez l’annonce une fois le besoin résolu.",
  },
];

function scrollToAnnouncements() {
  document
    .getElementById("annonces")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function timeAgo(timestamp: number) {
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return "Il y a moins d’une heure";
  if (hours < 24) return `Il y a ${hours} h`;
  if (hours < 48) return "Hier";
  return `Il y a ${Math.floor(hours / 24)} jours`;
}

function initials(name: string) {
  return name
    .split(/[\s&.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Tag({
  tone,
  icon: Icon,
  children,
}: {
  tone: "need" | "offer" | "neutral";
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em]",
        tone === "need" && "bg-soutien-975 text-soutien",
        tone === "offer" && "bg-relais-975 text-relais",
        tone === "neutral" && "bg-alt text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function FranceSolidaireApp({
  initialAnnouncements,
  demoMode = false,
}: {
  initialAnnouncements: Announcement[];
  demoMode?: boolean;
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [kind, setKind] = useState<FeedKind>("all");
  const [category, setCategory] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [role, setRole] = useState<Role>("helper");
  const [onboardingCategory, setOnboardingCategory] = useState("Transport");
  const [onboardingCommune, setOnboardingCommune] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishForm, setPublishForm] = useState<PublishForm>(emptyPublishForm);
  const [publishing, setPublishing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    return announcements.filter((announcement) => {
      const matchesKind = kind === "all" || announcement.kind === kind;
      const matchesCategory =
        category === "Toutes" || announcement.category === category;
      const haystack =
        `${announcement.title} ${announcement.description} ${announcement.commune}`.toLocaleLowerCase(
          "fr",
        );
      return (
        matchesKind &&
        matchesCategory &&
        (!normalizedSearch || haystack.includes(normalizedSearch))
      );
    });
  }, [announcements, category, kind, search]);

  const filtersActive =
    kind !== "all" || category !== "Toutes" || search.trim() !== "";

  function openOnboarding(initialRole: Role) {
    setRole(initialRole);
    setOnboardingStep(0);
    setOnboardingOpen(true);
  }

  function openPublish(publishKind: AnnouncementKind) {
    setPublishForm({ ...emptyPublishForm, kind: publishKind });
    setPublishOpen(true);
  }

  function resetFilters() {
    setKind("all");
    setCategory("Toutes");
    setSearch("");
  }

  function finishOnboarding() {
    const feedKind: FeedKind =
      role === "helper" ? "need" : role === "requester" ? "offer" : "all";
    setKind(feedKind);
    setCategory(onboardingCategory);
    setSearch(onboardingCommune);
    setOnboardingOpen(false);
    toast.success("Vos correspondances sont prêtes", {
      description:
        role === "helper"
          ? "Voici les personnes que vous pourriez aider."
          : role === "requester"
            ? "Voici les propositions qui peuvent vous être utiles."
            : "Voici les besoins et les propositions près de chez vous.",
    });
    window.setTimeout(scrollToAnnouncements, 150);
  }

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishing(true);
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishForm),
      });
      const data = (await response.json()) as {
        announcement?: Announcement;
        error?: string;
      };
      if (!response.ok || !data.announcement) {
        throw new Error(
          data.error ?? "La publication n’a pas été enregistrée.",
        );
      }
      const announcement = data.announcement;
      setAnnouncements((current) => [announcement, ...current]);
      setKind(announcement.kind);
      setCategory("Toutes");
      setSearch("");
      setPublishOpen(false);
      toast.success("Votre annonce est en ligne", {
        description:
          "Le lien privé de gestion a été mis en file pour envoi par email.",
      });
      window.setTimeout(scrollToAnnouncements, 150);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de publier pour le moment.",
      );
    } finally {
      setPublishing(false);
    }
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAnnouncement) return;
    setReplying(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: selectedAnnouncement.id,
          firstName: formData.get("firstName"),
          email: formData.get("email"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      setReplyOpen(false);
      toast.success("Confirmez votre adresse email", {
        description: `Un lien vient d’être mis en file. Votre message sera transmis à ${selectedAnnouncement.firstName} après votre confirmation.`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Vérifiez les informations saisies.",
      );
    } finally {
      setReplying(false);
    }
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          website: formData.get("website"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      setAccountOpen(false);
      toast.success("Lien de connexion mis en file", {
        description: "Vérifiez votre boîte email dans quelques instants.",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Connexion impossible.",
      );
    } finally {
      setAccountLoading(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAnnouncement) return;
    setReporting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: selectedAnnouncement.id,
          reason: formData.get("reason"),
          details: formData.get("details"),
          website: formData.get("website"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      setReportOpen(false);
      toast.success("Signalement transmis", {
        description: "Merci de contribuer à la sécurité de la communauté.",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Signalement impossible.",
      );
    } finally {
      setReporting(false);
    }
  }

  return (
    <>
      {demoMode && (
        <p className="notice-bar">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          Mode démonstration : la consultation fonctionne, les publications
          nécessitent la base de données.
        </p>
      )}

      <SiteHeader
        home
        onLogin={() => setAccountOpen(true)}
        onPublish={() => openPublish("need")}
      />

      <main id="contenu">
        {/* ---------------------------------------------------------- Accueil */}
        <section className="border-b border-line bg-blue-france-975">
          <div className="site-container grid gap-12 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-16">
            <div className="min-w-0">
              <p className="eyebrow">Entraide de proximité</p>
              <h1 className="display-title mt-5">
                Ici, un coup de main peut tout changer.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Publiez un besoin ou proposez votre aide, près de chez vous.
                Gratuit, sans compte obligatoire, entre particuliers.
              </p>

              <div
                id="publier"
                className="mt-8 flex scroll-mt-32 flex-col gap-3 sm:flex-row"
              >
                <Button
                  className="h-14 bg-blue-france px-6 text-base font-semibold text-white hover:bg-blue-france-hover"
                  onClick={() => openOnboarding("requester")}
                >
                  <HandHeart className="size-5" />
                  J’ai besoin d’aide
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-14 border-2 border-blue-france bg-white px-6 text-base font-semibold text-blue-france hover:bg-blue-france-950"
                  onClick={() => openOnboarding("helper")}
                >
                  <UsersRound className="size-5" />
                  Je veux aider
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] text-ink">
                {[
                  "Gratuit",
                  "Sans compte obligatoire",
                  "Données minimisées",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check
                      className="size-4 text-relais"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <aside
              aria-labelledby="dernieres-annonces"
              className="min-w-0 border border-line bg-white"
            >
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2
                  id="dernieres-annonces"
                  className="text-base font-bold text-ink"
                >
                  Dernières annonces publiées
                </h2>
                <span className="hidden text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:block">
                  Gironde
                </span>
              </div>
              <ul className="divide-y divide-line">
                {announcements.slice(0, 3).map((announcement) => {
                  const Icon = categoryIcons[announcement.category] ?? HandHeart;
                  const isNeed = announcement.kind === "need";
                  return (
                    <li key={announcement.id}>
                      <button
                        type="button"
                        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-blue-france-975"
                        onClick={() => {
                          setKind(announcement.kind);
                          setCategory("Toutes");
                          setSearch(announcement.commune);
                          scrollToAnnouncements();
                        }}
                      >
                        <span
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center",
                            isNeed
                              ? "bg-soutien-975 text-soutien"
                              : "bg-relais-975 text-relais",
                          )}
                        >
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">
                            {announcement.title}
                          </span>
                          <span className="mt-0.5 block text-[0.8125rem] text-muted-foreground">
                            {kindLabels[announcement.kind]} ·{" "}
                            {announcement.commune}
                          </span>
                        </span>
                        <ChevronRight
                          className="size-5 shrink-0 text-blue-france"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-line px-5 py-4">
                <button
                  type="button"
                  className="text-link text-[0.9375rem] font-semibold"
                  onClick={scrollToAnnouncements}
                >
                  Voir toutes les annonces
                </button>
              </div>
            </aside>
          </div>
        </section>

        {/* --------------------------------------------------------- Chiffres */}
        <section aria-label="Le service en bref" className="border-b border-line">
          <ul className="site-container grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ["2 minutes", "pour publier une annonce"],
              ["8 catégories", "du transport aux démarches"],
              ["0 €", "l’entraide reste toujours gratuite"],
            ].map(([value, label]) => (
              <li key={value} className="px-2 py-7 text-center md:px-6">
                <p className="text-3xl font-extrabold tracking-[-0.02em] text-blue-france">
                  {value}
                </p>
                <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                  {label}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* --------------------------------------------------------- Annonces */}
        <section id="annonces" className="scroll-mt-32 py-14 md:py-20">
          <div className="site-container">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="eyebrow">Les annonces</p>
                <h2 className="section-title mt-4">
                  La solidarité près de chez vous
                </h2>
                <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-muted-foreground">
                  Parcourez les besoins et les propositions. Seule la commune
                  est affichée publiquement.
                </p>
              </div>
              <Button
                className="h-12 shrink-0 bg-blue-france px-5 font-semibold text-white hover:bg-blue-france-hover"
                onClick={() => openPublish(kind === "offer" ? "offer" : "need")}
              >
                Publier une annonce
              </Button>
            </div>

            <div className="mt-8 border border-line bg-alt p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="min-w-0">
                  <Label
                    htmlFor="recherche-annonces"
                    className="mb-2 block font-semibold"
                  >
                    Rechercher une commune ou un besoin
                  </Label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="recherche-annonces"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Exemple : Mérignac, remorque, courses…"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <fieldset className="min-w-0">
                  <legend className="mb-2 text-[0.9375rem] font-semibold text-ink">
                    Type d’annonce
                  </legend>
                  <div className="flex flex-col divide-y divide-line border border-ink bg-white sm:flex-row sm:divide-x sm:divide-y-0">
                    {feedFilters.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        aria-pressed={kind === filter.value}
                        className={cn(
                          "min-h-12 flex-1 whitespace-nowrap px-4 text-[0.9375rem] font-semibold transition-colors",
                          kind === filter.value
                            ? "bg-blue-france text-white"
                            : "bg-white text-ink hover:bg-blue-france-975",
                        )}
                        onClick={() => setKind(filter.value)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <fieldset className="mt-4">
                <legend className="mb-2 text-[0.9375rem] font-semibold text-ink">
                  Catégorie
                </legend>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {["Toutes", ...categories].map((item) => {
                    const Icon =
                      item === "Toutes"
                        ? Handshake
                        : (categoryIcons[item] ?? HandHeart);
                    const active = category === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={active}
                        className={cn(
                          "flex min-h-10 shrink-0 items-center gap-2 border px-3.5 text-[0.9375rem] font-medium transition-colors",
                          active
                            ? "border-blue-france bg-blue-france text-white"
                            : "border-line bg-white text-ink hover:border-blue-france hover:text-blue-france",
                        )}
                        onClick={() => setCategory(item)}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        {item}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p
                role="status"
                aria-live="polite"
                className="text-[0.9375rem] font-semibold text-ink"
              >
                {filteredAnnouncements.length} annonce
                {filteredAnnouncements.length > 1 ? "s" : ""} affichée
                {filteredAnnouncements.length > 1 ? "s" : ""}
              </p>
              {filtersActive && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[0.9375rem] font-semibold text-blue-france underline underline-offset-4"
                  onClick={resetFilters}
                >
                  <X className="size-4" aria-hidden="true" />
                  Effacer les filtres
                </button>
              )}
            </div>

            {filteredAnnouncements.length ? (
              <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredAnnouncements.map((announcement) => (
                  <li key={announcement.id} className="min-w-0">
                    <AnnouncementCard
                      announcement={announcement}
                      onReply={() => {
                        setSelectedAnnouncement(announcement);
                        setReplyOpen(true);
                      }}
                      onReport={() => {
                        setSelectedAnnouncement(announcement);
                        setReportOpen(true);
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 border border-line bg-alt px-6 py-14 text-center">
                <span className="mx-auto flex size-12 items-center justify-center bg-white text-blue-france">
                  <Search className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">
                  Aucune annonce ne correspond à votre recherche
                </h3>
                <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-6 text-muted-foreground">
                  Essayez une autre commune, élargissez la catégorie, ou publiez
                  votre propre annonce.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    className="h-12 border-2 border-blue-france px-5 font-semibold text-blue-france hover:bg-blue-france-975"
                    onClick={resetFilters}
                  >
                    Effacer les filtres
                  </Button>
                  <Button
                    className="h-12 bg-blue-france px-5 font-semibold text-white hover:bg-blue-france-hover"
                    onClick={() => openPublish("need")}
                  >
                    Publier une annonce
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* -------------------------------------------------- Comment ça marche */}
        <section
          id="comment-ca-marche"
          className="scroll-mt-32 border-y border-line bg-soutien-975 py-14 md:py-20"
        >
          <div className="site-container">
            <p className="eyebrow">Mode d’emploi</p>
            <h2 className="section-title mt-4 max-w-2xl">
              Trois étapes, sans dossier à monter
            </h2>
            <ol className="mt-10 grid gap-px bg-line md:grid-cols-3">
              {steps.map((step) => (
                <li key={step.number} className="bg-white p-6 md:p-7">
                  <span className="flex size-11 items-center justify-center bg-soutien text-xl font-extrabold text-white">
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-7 text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------- Engagement */}
        <section id="engagement" className="scroll-mt-32 py-14 md:py-20">
          <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <p className="eyebrow">Notre engagement</p>
              <h2 className="section-title mt-4">
                La confiance, avec des règles claires
              </h2>
              <p className="mt-4 max-w-xl text-[1.0625rem] leading-7 text-muted-foreground">
                France Solidaire facilite la rencontre entre voisins. Chacun
                reste libre d’accepter une aide et de partager ses coordonnées
                au moment qui lui convient.
              </p>
              <div className="callout mt-6">
                <p className="flex gap-3 text-[0.9375rem] leading-6 text-ink">
                  <CircleAlert
                    className="mt-0.5 size-5 shrink-0 text-blue-france"
                    aria-hidden="true"
                  />
                  <span>
                    En cas de danger immédiat, appelez le <strong>15</strong>,
                    le <strong>18</strong> ou le <strong>112</strong>. La
                    plateforme ne remplace ni les services d’urgence, ni un
                    professionnel qualifié.
                  </span>
                </p>
              </div>
            </div>

            <ul className="grid gap-px bg-line sm:grid-cols-2">
              {safetyItems.map(({ label, text, icon: Icon }) => (
                <li key={label} className="bg-white p-5">
                  <span className="flex size-10 items-center justify-center bg-blue-france-950 text-blue-france">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-ink">{label}</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-6 text-muted-foreground">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------------------- CTA */}
        <section className="bg-blue-france py-12 text-white md:py-16">
          <div className="site-container flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] md:text-3xl">
                Et si c’était aujourd’hui&nbsp;?
              </h2>
              <p className="mt-2 max-w-xl text-white/80">
                Quelques minutes de votre temps peuvent vraiment changer la
                semaine de quelqu’un près de chez vous.
              </p>
            </div>
            <Button
              className="h-14 shrink-0 bg-white px-6 text-base font-semibold text-blue-france hover:bg-blue-france-950"
              onClick={() => openOnboarding("helper")}
            >
              Je propose mon aide
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />

      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        step={onboardingStep}
        setStep={setOnboardingStep}
        role={role}
        setRole={setRole}
        category={onboardingCategory}
        setCategory={setOnboardingCategory}
        commune={onboardingCommune}
        setCommune={setOnboardingCommune}
        onFinish={finishOnboarding}
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        form={publishForm}
        setForm={setPublishForm}
        loading={publishing}
        onSubmit={submitAnnouncement}
      />

      <ReplyDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        announcement={selectedAnnouncement}
        loading={replying}
        onSubmit={submitReply}
      />

      <AccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        loading={accountLoading}
        onSubmit={submitAccount}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        announcement={selectedAnnouncement}
        loading={reporting}
        onSubmit={submitReport}
      />
    </>
  );
}

function AnnouncementCard({
  announcement,
  onReply,
  onReport,
}: {
  announcement: Announcement;
  onReply: () => void;
  onReport: () => void;
}) {
  const Icon = categoryIcons[announcement.category] ?? HandHeart;
  const isNeed = announcement.kind === "need";
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        "announcement-card flex h-full flex-col border border-line border-l-4 bg-white",
        isNeed ? "border-l-soutien" : "border-l-relais",
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={isNeed ? "need" : "offer"}>
            {kindLabels[announcement.kind]}
          </Tag>
          <Tag tone="neutral" icon={Icon}>
            {announcement.category}
          </Tag>
        </div>

        <h3 className="mt-4 text-[1.125rem] font-bold leading-snug tracking-[-0.01em] text-ink">
          {announcement.title}
        </h3>

        <p
          className={cn(
            "mt-2 text-[0.9375rem] leading-6 text-muted-foreground",
            !expanded && "line-clamp-3",
          )}
        >
          {announcement.description}
        </p>
        <button
          type="button"
          aria-expanded={expanded}
          className="mt-2 w-fit text-[0.875rem] font-semibold text-blue-france underline underline-offset-4"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Réduire" : "Voir le détail"}
        </button>

        <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-[0.875rem] text-ink">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Commune</dt>
            <MapPin
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <dd className="font-medium">{announcement.commune}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Disponibilité</dt>
            <CalendarDays
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <dd>{announcement.availability}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-alt px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center text-[0.75rem] font-bold",
              isNeed
                ? "bg-soutien-975 text-soutien"
                : "bg-relais-975 text-relais",
            )}
            aria-hidden="true"
          >
            {initials(announcement.firstName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.9375rem] font-semibold text-ink">
              {announcement.firstName}
            </span>
            <span className="block text-xs text-muted-foreground">
              {timeAgo(announcement.createdAt)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 max-sm:w-full">
          <Button
            type="button"
            aria-label={`Signaler l’annonce ${announcement.title}`}
            title="Signaler cette annonce"
            variant="ghost"
            className="size-11 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={onReport}
          >
            <Flag />
          </Button>
          <Button
            className="h-11 bg-blue-france px-4 font-semibold text-white hover:bg-blue-france-hover max-sm:flex-1"
            onClick={onReply}
          >
            {isNeed ? "Je peux aider" : "Ça m’intéresse"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function DialogShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogContent
      className={cn(
        "max-h-[92vh] overflow-y-auto border-t-4 border-t-blue-france p-0",
        className,
      )}
    >
      {children}
    </DialogContent>
  );
}

function OnboardingDialog({
  open,
  onOpenChange,
  step,
  setStep,
  role,
  setRole,
  category,
  setCategory,
  commune,
  setCommune,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: number;
  setStep: (step: number) => void;
  role: Role;
  setRole: (role: Role) => void;
  category: string;
  setCategory: (category: string) => void;
  commune: string;
  setCommune: (commune: string) => void;
  onFinish: () => void;
}) {
  const roleLabel =
    role === "helper"
      ? "proposer votre aide"
      : role === "requester"
        ? "trouver de l’aide"
        : "aider et être aidé";

  useEffect(() => {
    document.getElementById("onboarding-step-title")?.focus();
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell className="sm:max-w-2xl">
        <div className="px-5 pt-6 sm:px-7">
          <DialogHeader>
            <p className="text-xs font-bold uppercase tracking-[0.09em] text-blue-france">
              Étape {step + 1} sur 3
            </p>
            <DialogTitle
              id="onboarding-step-title"
              tabIndex={-1}
              className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink outline-none"
            >
              {step === 0 && "Que souhaitez-vous faire ?"}
              {step === 1 && `Comment souhaitez-vous ${roleLabel} ?`}
              {step === 2 && "Dans quelle commune ?"}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {step === 0 &&
                "Votre réponse nous permet de vous montrer les annonces les plus utiles."}
              {step === 1 &&
                "Choisissez la catégorie principale. Vous pourrez en explorer d’autres ensuite."}
              {step === 2 &&
                "La commune suffit : aucune adresse exacte ne sera affichée."}
            </DialogDescription>
          </DialogHeader>
          <div
            className="mt-5 flex h-1.5 gap-1"
            role="img"
            aria-label={`Étape ${step + 1} sur 3`}
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "h-full flex-1",
                  index <= step ? "bg-blue-france" : "bg-line",
                )}
              />
            ))}
          </div>
        </div>

        <div className="px-5 py-6 sm:px-7">
          {step === 0 && (
            <div
              className="grid gap-3"
              role="radiogroup"
              aria-label="Votre rôle"
            >
              {[
                {
                  value: "requester" as Role,
                  icon: HandHeart,
                  title: "J’ai besoin d’aide",
                  text: "Trouver une personne, du matériel ou un coup de main.",
                },
                {
                  value: "helper" as Role,
                  icon: UsersRound,
                  title: "Je veux aider",
                  text: "Proposer mon temps, mes compétences ou du matériel.",
                },
                {
                  value: "both" as Role,
                  icon: Handshake,
                  title: "Les deux",
                  text: "Je peux avoir un besoin tout en aidant à mon tour.",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={role === option.value}
                  className={cn(
                    "flex items-center gap-4 border-2 p-4 text-left transition-colors",
                    role === option.value
                      ? "border-blue-france bg-blue-france-975"
                      : "border-line bg-white hover:border-blue-france",
                  )}
                  onClick={() => setRole(option.value)}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center",
                      role === option.value
                        ? "bg-blue-france text-white"
                        : "bg-alt text-blue-france",
                    )}
                  >
                    <option.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-ink">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-[0.9375rem] leading-6 text-muted-foreground">
                      {option.text}
                    </span>
                  </span>
                  {role === option.value && (
                    <Check
                      className="size-5 text-blue-france"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Catégorie d’entraide"
            >
              {categories.map((item) => {
                const Icon = categoryIcons[item] ?? HandHeart;
                return (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={category === item}
                    className={cn(
                      "flex min-h-24 flex-col items-center justify-center gap-2 border-2 p-3 text-center text-[0.9375rem] font-semibold transition-colors",
                      category === item
                        ? "border-blue-france bg-blue-france-975 text-blue-france"
                        : "border-line bg-white text-ink hover:border-blue-france",
                    )}
                    onClick={() => setCategory(item)}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                    {item}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="onboarding-commune" className="font-semibold">
                  Votre commune
                </Label>
                <Input
                  id="onboarding-commune"
                  autoComplete="address-level2"
                  value={commune}
                  onChange={(event) => setCommune(event.target.value)}
                  placeholder="Exemple : Sainte-Hélène"
                  className="h-12"
                />
              </div>
              <p className="callout flex gap-3 text-[0.9375rem] leading-6 text-ink">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-blue-france"
                  aria-hidden="true"
                />
                <span>
                  Vous pouvez parcourir toutes les annonces sans créer de
                  compte. Votre commune sert uniquement à filtrer l’affichage.
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 border-t border-line bg-alt px-5 py-4 sm:px-7">
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 font-semibold text-blue-france"
              onClick={() => setStep(step - 1)}
            >
              Retour
            </Button>
          )}
          <Button
            type="button"
            className="h-12 bg-blue-france px-5 font-semibold text-white hover:bg-blue-france-hover"
            disabled={step === 2 && !commune.trim()}
            onClick={() => (step < 2 ? setStep(step + 1) : onFinish())}
          >
            {step < 2 ? "Continuer" : "Voir mes correspondances"}
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogShell>
    </Dialog>
  );
}

function PublishDialog({
  open,
  onOpenChange,
  form,
  setForm,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PublishForm;
  setForm: (form: PublishForm) => void;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const update = (field: keyof PublishForm, value: string) =>
    setForm({ ...form, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell className="sm:max-w-2xl">
        <form onSubmit={onSubmit}>
          <div className="px-5 pt-6 sm:px-7">
            <DialogHeader>
              <p className="text-xs font-bold uppercase tracking-[0.09em] text-blue-france">
                Nouvelle annonce
              </p>
              <DialogTitle className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink">
                Que souhaitez-vous partager ?
              </DialogTitle>
              <DialogDescription>
                Les champs sont tous obligatoires. Votre email ne sera jamais
                affiché publiquement.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[0.9375rem] font-semibold text-ink">
                Type d’annonce
              </legend>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Type d’annonce"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.kind === "need"}
                  className={cn(
                    "min-h-12 border-2 px-4 text-[0.9375rem] font-semibold transition-colors",
                    form.kind === "need"
                      ? "border-soutien bg-soutien-975 text-soutien"
                      : "border-line bg-white text-ink hover:border-soutien",
                  )}
                  onClick={() => update("kind", "need")}
                >
                  J’ai besoin d’aide
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.kind === "offer"}
                  className={cn(
                    "min-h-12 border-2 px-4 text-[0.9375rem] font-semibold transition-colors",
                    form.kind === "offer"
                      ? "border-relais bg-relais-975 text-relais"
                      : "border-line bg-white text-ink hover:border-relais",
                  )}
                  onClick={() => update("kind", "offer")}
                >
                  Je propose mon aide
                </button>
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="publish-category" className="font-semibold">
                Catégorie
              </Label>
              <Select
                value={form.category}
                onValueChange={(value) => value && update("category", value)}
              >
                <SelectTrigger id="publish-category" className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-commune" className="font-semibold">
                Commune
              </Label>
              <Input
                id="publish-commune"
                required
                minLength={2}
                maxLength={120}
                autoComplete="address-level2"
                value={form.commune}
                onChange={(event) => update("commune", event.target.value)}
                placeholder="Exemple : Le Temple"
                className="h-12"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publish-title" className="font-semibold">
                Titre de l’annonce
              </Label>
              <Input
                id="publish-title"
                required
                minLength={5}
                maxLength={100}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Exemple : une remorque pour déplacer des meubles"
                className="h-12"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publish-description" className="font-semibold">
                Quelques précisions
              </Label>
              <Textarea
                id="publish-description"
                aria-describedby="publish-public-warning"
                required
                minLength={15}
                maxLength={1_000}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Expliquez simplement le besoin, le matériel disponible et les éventuelles contraintes…"
                className="min-h-28 py-3"
              />
              <p
                id="publish-public-warning"
                className="flex gap-2 text-[0.8125rem] leading-5 text-soutien"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                N’écrivez aucune adresse précise, aucun téléphone, email ou lien
                dans le texte public.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-availability" className="font-semibold">
                Disponibilité
              </Label>
              <Input
                id="publish-availability"
                required
                maxLength={160}
                value={form.availability}
                onChange={(event) => update("availability", event.target.value)}
                placeholder="Exemple : samedi matin"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-name" className="font-semibold">
                Votre prénom
              </Label>
              <Input
                id="publish-name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                placeholder="Prénom ou initiales"
                className="h-12"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publish-email" className="font-semibold">
                Votre email
              </Label>
              <Input
                id="publish-email"
                required
                type="email"
                maxLength={320}
                autoComplete="email"
                aria-describedby="publish-email-help"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="vous@exemple.fr"
                className="h-12"
              />
              <p
                id="publish-email-help"
                className="text-[0.8125rem] text-muted-foreground"
              >
                Il sert à recevoir les réponses et le lien privé de gestion de
                l’annonce.
              </p>
            </div>

            <div className="hidden" aria-hidden="true">
              <Label htmlFor="publish-website">Site internet</Label>
              <Input
                id="publish-website"
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <aside
              className="border border-line bg-alt p-4 sm:col-span-2"
              aria-label="Aperçu public de l’annonce"
            >
              <p className="text-xs font-bold uppercase tracking-[0.09em] text-blue-france">
                Aperçu public
              </p>
              <h3 className="mt-3 font-bold text-ink">
                {form.title || "Le titre de votre annonce"}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-6 text-muted-foreground">
                {form.description || "Votre description apparaîtra ici."}
              </p>
              <p className="mt-3 text-[0.8125rem] text-muted-foreground">
                {form.commune || "Commune"} ·{" "}
                {form.availability || "Disponibilité"} ·{" "}
                {form.firstName || "Prénom"}
              </p>
            </aside>
          </div>

          <DialogFooter className="m-0 border-t border-line bg-alt px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 bg-blue-france px-5 font-semibold text-white hover:bg-blue-france-hover"
            >
              {loading ? <LoaderCircle className="animate-spin" /> : null}
              Publier gratuitement
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>
    </Dialog>
  );
}

function ReplyDialog({
  open,
  onOpenChange,
  announcement,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!announcement) return null;
  const isNeed = announcement.kind === "need";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <div className="px-5 pt-6 sm:px-7">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone={isNeed ? "need" : "offer"} icon={MessageCircle}>
                  Contacter {announcement.firstName}
                </Tag>
              </div>
              <DialogTitle className="mt-3 text-xl font-extrabold tracking-[-0.02em] text-ink">
                {announcement.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {announcement.commune}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reply-name" className="font-semibold">
                  Votre prénom
                </Label>
                <Input
                  id="reply-name"
                  name="firstName"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="given-name"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-email" className="font-semibold">
                  Votre email
                </Label>
                <Input
                  id="reply-email"
                  name="email"
                  type="email"
                  required
                  maxLength={320}
                  autoComplete="email"
                  aria-describedby="reply-email-help"
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-message" className="font-semibold">
                Votre message
              </Label>
              <Textarea
                id="reply-message"
                name="message"
                required
                minLength={10}
                maxLength={1_200}
                defaultValue={
                  isNeed
                    ? `Bonjour ${announcement.firstName}, je pense pouvoir vous aider.`
                    : `Bonjour ${announcement.firstName}, votre proposition pourrait m’aider.`
                }
                className="min-h-28 py-3"
              />
            </div>
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="reply-website">Site internet</Label>
              <Input
                id="reply-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <p
              id="reply-email-help"
              className="callout flex gap-3 text-[0.9375rem] leading-6 text-ink"
            >
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-blue-france"
                aria-hidden="true"
              />
              <span>
                Votre adresse email sera transmise uniquement à cette personne,
                après confirmation par un lien que nous vous envoyons.
              </span>
            </p>
          </div>

          <DialogFooter className="m-0 border-t border-line bg-alt px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 bg-blue-france px-5 font-semibold text-white hover:bg-blue-france-hover"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Envoyer mon message
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>
    </Dialog>
  );
}

function AccountDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <div className="px-6 pt-7">
            <span className="flex size-12 items-center justify-center bg-blue-france text-white">
              <UserRound className="size-6" aria-hidden="true" />
            </span>
            <DialogHeader className="mt-5">
              <DialogTitle className="text-2xl font-extrabold tracking-[-0.02em] text-ink">
                Accéder à mon espace
              </DialogTitle>
              <DialogDescription className="leading-6">
                Aucun mot de passe. Vous recevez un lien personnel par email
                pour retrouver vos annonces et vos réponses.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="account-email" className="font-semibold">
                Votre email
              </Label>
              <Input
                id="account-email"
                name="email"
                type="email"
                required
                maxLength={320}
                autoComplete="email"
                placeholder="vous@exemple.fr"
                className="h-12"
              />
            </div>
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="account-website">Site internet</Label>
              <Input
                id="account-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-blue-france font-semibold text-white hover:bg-blue-france-hover"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Recevoir mon lien de connexion
            </Button>
            <ul className="grid gap-2 border border-line bg-alt p-4 text-[0.9375rem] text-ink">
              {[
                "Retrouver et fermer vos annonces",
                "Lire les réponses reçues",
                "Supprimer vos données vous-même",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check
                    className="size-4 shrink-0 text-relais"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[0.8125rem] leading-5 text-muted-foreground">
              Le lien est personnel, utilisable une seule fois et expire après
              15 minutes.
            </p>
          </div>
        </form>
      </DialogShell>
    </Dialog>
  );
}

function ReportDialog({
  open,
  onOpenChange,
  announcement,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!announcement) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <div className="px-6 pt-7">
            <DialogHeader>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.09em] text-destructive">
                <Flag className="size-3.5" aria-hidden="true" />
                Signalement
              </p>
              <DialogTitle className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-ink">
                Signaler « {announcement.title} »
              </DialogTitle>
              <DialogDescription>
                L’annonce est masquée automatiquement après plusieurs
                signalements indépendants, puis examinée.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="report-reason" className="font-semibold">
                Motif du signalement
              </Label>
              <Select name="reason" defaultValue="fraude" required>
                <SelectTrigger id="report-reason" className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fraude">Fraude ou arnaque</SelectItem>
                  <SelectItem value="coordonnees">
                    Coordonnées personnelles publiques
                  </SelectItem>
                  <SelectItem value="danger">
                    Intervention dangereuse
                  </SelectItem>
                  <SelectItem value="commerce">
                    Offre commerciale ou payante
                  </SelectItem>
                  <SelectItem value="harcelement">
                    Harcèlement ou contenu offensant
                  </SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-details" className="font-semibold">
                Précisions facultatives
              </Label>
              <Textarea
                id="report-details"
                name="details"
                maxLength={600}
                className="min-h-24 py-3"
              />
            </div>
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="report-website">Site internet</Label>
              <Input
                id="report-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="m-0 border-t border-line bg-alt px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="h-12 px-5 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Flag className="size-4" />
              )}
              Transmettre le signalement
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>
    </Dialog>
  );
}
