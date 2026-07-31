"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleHelp,
  Construction,
  Dog,
  FileText,
  Flag,
  HandHeart,
  Heart,
  Home,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageOpen,
  Search,
  ShieldCheck,
  Sparkles,
  SprayCan,
  UserRound,
  UsersRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const safetyItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Votre adresse reste privée", icon: MapPin },
  { label: "Les coordonnées ne sont jamais publiques", icon: Mail },
  { label: "Chaque annonce peut être signalée", icon: ShieldCheck },
  { label: "Les interventions dangereuses sont exclues", icon: Wrench },
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

export function FranceSolidaireApp({
  initialAnnouncements,
  demoMode = false,
}: {
  initialAnnouncements: Announcement[];
  demoMode?: boolean;
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [kind, setKind] = useState<FeedKind>("need");
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

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

  function openOnboarding(initialRole: Role) {
    setRole(initialRole);
    setOnboardingStep(0);
    setOnboardingOpen(true);
  }

  function openPublish(publishKind: AnnouncementKind) {
    setPublishForm({ ...emptyPublishForm, kind: publishKind });
    setPublishOpen(true);
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
    <main id="contenu" className="min-h-screen bg-background">
      {demoMode && (
        <div className="demo-ribbon">
          <Sparkles className="size-3.5" />
          Mode démonstration · les écritures nécessitent PostgreSQL
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-foreground/6 bg-background/92 backdrop-blur-xl">
        <div className="site-container flex h-18 items-center justify-between">
          <a href="#contenu" className="group flex items-center gap-2.5">
            <span className="brand-mark">
              <Heart className="size-5 fill-current" />
            </span>
            <span className="text-[1.05rem] font-bold tracking-[-0.025em] text-ink">
              France <span className="text-coral">Solidaire</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <button
              type="button"
              className="transition-colors hover:text-ink"
              onClick={scrollToAnnouncements}
            >
              Les annonces
            </button>
            <a
              className="transition-colors hover:text-ink"
              href="#comment-ca-marche"
            >
              Comment ça marche
            </a>
            <a className="transition-colors hover:text-ink" href="#securite">
              Notre engagement
            </a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              className="h-10 rounded-full px-4 text-ink"
              onClick={() => setAccountOpen(true)}
            >
              <UserRound />
              Se connecter
            </Button>
            <Button
              className="h-10 rounded-full bg-ink px-5 text-white hover:bg-ink/90"
              onClick={() => openPublish("need")}
            >
              Publier une annonce
            </Button>
          </div>

          <Button
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileOpen && (
          <div
            id="menu-mobile"
            className="site-container grid gap-2 border-t py-4 md:hidden"
          >
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setMobileOpen(false);
                scrollToAnnouncements();
              }}
            >
              Les annonces
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setMobileOpen(false);
                setAccountOpen(true);
              }}
            >
              Se connecter
            </Button>
            <Button
              className="mt-2 bg-ink text-white"
              onClick={() => {
                setMobileOpen(false);
                openPublish("need");
              }}
            >
              Publier une annonce
            </Button>
          </div>
        )}
      </header>

      <section className="hero-section">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="site-container relative grid grid-cols-[minmax(0,1fr)] items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:py-24">
          <div className="min-w-0 max-w-3xl">
            <Badge className="mb-7 h-7 border-terracotta/15 bg-terracotta/8 px-3 text-terracotta hover:bg-terracotta/8">
              <MapPin />
              L’entraide commence en Gironde
            </Badge>
            <h1 className="hero-title">
              Ici, un coup de main
              <span> peut tout changer.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Un besoin près de chez vous, quelqu’un prêt à aider. Publiez une
              annonce ou trouvez comment être utile, simplement et gratuitement.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-14 rounded-2xl bg-coral px-6 text-base font-semibold text-white shadow-lg shadow-coral/18 hover:bg-coral/90"
                onClick={() => openOnboarding("requester")}
              >
                <HandHeart className="size-5" />
                J’ai besoin d’aide
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-ink/12 bg-white/70 px-6 text-base font-semibold text-ink shadow-sm hover:bg-white"
                onClick={() => openOnboarding("helper")}
              >
                <UsersRound className="size-5 text-teal" />
                Je veux aider
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-teal" /> Gratuit
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-teal" /> Sans compte obligatoire
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-teal" /> Entre particuliers
              </span>
            </div>
          </div>

          <div className="relative mx-auto min-w-0 w-full max-w-lg">
            <div className="absolute -inset-5 rotate-3 rounded-[2.4rem] bg-sun/35" />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-[0_28px_80px_rgba(34,55,49,0.14)] backdrop-blur md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
                    Près de chez vous
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
                    Les derniers élans solidaires
                  </h2>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <Bell className="size-5" />
                </span>
              </div>

              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => {
                  const Icon = categoryIcons[announcement.category] ?? Heart;
                  return (
                    <button
                      key={announcement.id}
                      type="button"
                      className="group flex w-full items-center gap-3 rounded-2xl border border-ink/7 bg-cream/60 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-coral/20 hover:bg-white hover:shadow-md"
                      onClick={() => {
                        setKind(announcement.kind);
                        setCategory("Toutes");
                        setSearch(announcement.commune);
                        scrollToAnnouncements();
                      }}
                    >
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl",
                          announcement.kind === "need"
                            ? "bg-coral/10 text-coral"
                            : "bg-teal/10 text-teal",
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">
                          {announcement.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {announcement.commune}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                className="mt-4 h-10 w-full rounded-xl text-teal"
                onClick={scrollToAnnouncements}
              >
                Voir toutes les annonces
                <ArrowDown className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/6 bg-white">
        <div className="site-container grid divide-y divide-ink/6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            ["2 minutes", "pour publier un besoin"],
            ["8 catégories", "pour trouver le bon coup de main"],
            ["0 €", "l’entraide reste toujours gratuite"],
          ].map(([value, label]) => (
            <div key={value} className="px-5 py-7 text-center">
              <p className="text-2xl font-bold tracking-tight text-ink">
                {value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="annonces" className="scroll-mt-24 py-18 md:py-24">
        <div className="site-container">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Badge
                variant="outline"
                className="mb-4 border-teal/15 bg-teal/6 text-teal"
              >
                En ce moment
              </Badge>
              <h2 className="section-title">La solidarité à portée de main</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Parcourez les besoins et les propositions. Seule la commune est
                affichée publiquement.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-ink/10 bg-white px-5 text-ink"
              onClick={() => openPublish(kind === "all" ? "need" : kind)}
            >
              <Heart className="text-coral" />
              Publier une annonce
            </Button>
          </div>

          <div className="mt-9 rounded-[1.4rem] border border-ink/7 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Tabs
                value={kind}
                onValueChange={(value) => setKind(value as AnnouncementKind)}
                className="shrink-0"
              >
                <TabsList className="h-11 w-full rounded-xl bg-cream p-1 lg:w-auto">
                  <TabsTrigger
                    value="all"
                    className="h-9 rounded-lg px-4 data-active:bg-white"
                  >
                    Tous
                  </TabsTrigger>
                  <TabsTrigger
                    value="need"
                    className="h-9 rounded-lg px-4 data-active:bg-white"
                  >
                    Besoins
                  </TabsTrigger>
                  <TabsTrigger
                    value="offer"
                    className="h-9 rounded-lg px-4 data-active:bg-white"
                  >
                    Propositions
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Separator
                orientation="vertical"
                className="hidden h-8 lg:block"
              />

              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Rechercher une annonce ou une commune"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une commune ou un besoin…"
                  className="h-11 rounded-xl border-0 bg-cream/70 pl-10 shadow-none focus-visible:ring-teal/25"
                />
              </div>

              <Select
                value={category}
                onValueChange={(value) => setCategory(value ?? "Toutes")}
              >
                <SelectTrigger
                  aria-label="Filtrer par catégorie"
                  className="h-11 w-full rounded-xl border-ink/8 px-3 lg:w-48"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toutes">Toutes les catégories</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["Toutes", ...categories].map((item) => {
              const Icon =
                item === "Toutes" ? Sparkles : (categoryIcons[item] ?? Heart);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                    category === item
                      ? "border-ink bg-ink text-white"
                      : "border-ink/8 bg-white text-muted-foreground hover:border-ink/20 hover:text-ink",
                  )}
                  onClick={() => setCategory(item)}
                >
                  <Icon className="size-3.5" />
                  {item}
                </button>
              );
            })}
          </div>

          <p
            role="status"
            aria-live="polite"
            className="mt-5 text-sm font-medium text-muted-foreground"
          >
            {filteredAnnouncements.length} annonce
            {filteredAnnouncements.length > 1 ? "s" : ""} affichée
            {filteredAnnouncements.length > 1 ? "s" : ""}
          </p>

          {filteredAnnouncements.length ? (
            <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cream text-muted-foreground">
                <Search className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">
                Aucune annonce ne correspond encore
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Essayez une autre commune ou publiez votre propre annonce.
              </p>
              <Button
                className="mt-5 bg-coral text-white"
                onClick={() => openPublish(kind === "all" ? "need" : kind)}
              >
                Publier une annonce
              </Button>
            </div>
          )}
        </div>
      </section>

      <section
        id="comment-ca-marche"
        className="scroll-mt-24 bg-ink py-18 text-white md:py-24"
      >
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-5 bg-white/10 text-white hover:bg-white/10">
              Simple par choix
            </Badge>
            <h2 className="section-title text-white">
              De l’intention à l’action, sans détour
            </h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              Pas de dossier à monter. Quelques informations suffisent pour que
              les bonnes personnes puissent se trouver.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: MessageCircle,
                title: "Dites-nous l’essentiel",
                text: "Un besoin, une proposition, une commune et le moment qui vous convient.",
              },
              {
                number: "02",
                icon: Search,
                title: "Trouvez la bonne personne",
                text: "Les annonces sont classées par type d’aide et par proximité.",
              },
              {
                number: "03",
                icon: HandHeart,
                title: "Organisez-vous librement",
                text: "Échangez, convenez des détails et fermez l’annonce une fois le besoin résolu.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-6"
              >
                <span className="absolute right-5 top-3 text-5xl font-black text-white/5">
                  {item.number}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-sun">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 leading-6 text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="securite" className="scroll-mt-24 bg-sand py-18 md:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="flex size-13 items-center justify-center rounded-2xl bg-teal text-white shadow-lg shadow-teal/15">
              <ShieldCheck className="size-6" />
            </span>
            <h2 className="section-title mt-6">
              La confiance, avec quelques réflexes simples
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              France Solidaire facilite la rencontre. Chacun reste libre
              d’accepter une aide et de partager ses coordonnées au moment qui
              lui convient.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {safetyItems.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-ink/7 bg-white p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal/8 text-teal">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-ink">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-coral px-4 py-14 md:py-18">
        <div className="site-container flex flex-col items-center justify-between gap-7 rounded-[2rem] bg-white/10 px-6 py-9 text-center text-white md:flex-row md:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/65">
              Et si c’était aujourd’hui ?
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Quelques minutes peuvent vraiment aider.
            </h2>
          </div>
          <Button
            className="h-12 shrink-0 rounded-xl bg-white px-6 font-semibold text-coral hover:bg-white/90"
            onClick={() => openOnboarding("helper")}
          >
            Je propose mon aide
            <ArrowRight />
          </Button>
        </div>
      </section>

      <footer className="bg-ink py-10 text-white">
        <div className="site-container flex flex-col items-center justify-between gap-5 border-b border-white/10 pb-8 md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="brand-mark bg-coral text-white">
              <Heart className="size-5 fill-current" />
            </span>
            <span className="font-bold">
              France <span className="text-coral">Solidaire</span>
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            <a href="#annonces" className="hover:text-white">
              Annonces
            </a>
            <a href="#comment-ca-marche" className="hover:text-white">
              Comment ça marche
            </a>
            <a href="#securite" className="hover:text-white">
              Sécurité
            </a>
            <button
              type="button"
              className="hover:text-white"
              onClick={() => setAccountOpen(true)}
            >
              Mon compte
            </button>
            <a href="/confidentialite" className="hover:text-white">
              Confidentialité
            </a>
            <a href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </a>
          </div>
        </div>
        <div className="site-container flex flex-col items-center justify-between gap-3 pt-6 text-xs text-white/40 md:flex-row">
          <p>© 2026 France Solidaire · Une initiative citoyenne</p>
          <p>L’aide proposée sur la plateforme est toujours gratuite.</p>
        </div>
      </footer>

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
    </main>
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
  const Icon = categoryIcons[announcement.category] ?? Heart;
  const isNeed = announcement.kind === "need";
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="announcement-card border-0 py-0 ring-1 ring-ink/8">
      <CardHeader className="gap-4 px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge
            className={cn(
              "h-7 px-2.5",
              isNeed
                ? "bg-coral/9 text-coral hover:bg-coral/9"
                : "bg-teal/9 text-teal hover:bg-teal/9",
            )}
          >
            <Icon />
            {announcement.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {timeAgo(announcement.createdAt)}
          </span>
        </div>
        <div>
          <CardTitle className="text-[1.08rem] font-semibold tracking-[-0.015em] text-ink">
            {announcement.title}
          </CardTitle>
          <CardDescription className="mt-2 flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5" />
            {announcement.commune}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        <p
          className={cn(
            "text-sm leading-6 text-muted-foreground",
            !expanded && "line-clamp-3 min-h-18",
          )}
        >
          {announcement.description}
        </p>
        <Button
          type="button"
          variant="link"
          className="mt-1 h-auto px-0 text-xs text-teal"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Réduire" : "Voir le détail"}
        </Button>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream/80 px-3 py-2.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 text-teal" />
          {announcement.availability}
        </div>
      </CardContent>

      <CardFooter className="mt-1 flex-wrap justify-between gap-3 border-ink/6 bg-white px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback
              className={cn(
                "text-[0.68rem] font-bold",
                isNeed ? "bg-coral/10 text-coral" : "bg-teal/10 text-teal",
              )}
            >
              {initials(announcement.firstName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium text-ink">
            {announcement.firstName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            aria-label={`Signaler l’annonce ${announcement.title}`}
            title="Signaler"
            variant="ghost"
            size="icon-sm"
            onClick={onReport}
          >
            <Flag />
          </Button>
          <Button
            className={cn(
              "h-9 rounded-xl px-3.5",
              isNeed
                ? "bg-coral text-white hover:bg-coral/90"
                : "bg-teal text-white hover:bg-teal/90",
            )}
            onClick={onReply}
          >
            {isNeed ? "Je peux aider" : "Ça m’intéresse"}
          </Button>
        </div>
      </CardFooter>
    </Card>
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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.6rem] p-0 sm:max-w-xl">
        <div className="px-5 pt-6 sm:px-7">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-coral/10 text-coral">
                <Heart className="size-4 fill-current" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Trouvons la bonne entraide
              </span>
            </div>
            <DialogTitle
              id="onboarding-step-title"
              tabIndex={-1}
              className="text-2xl font-bold tracking-tight text-ink outline-none"
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
          <Progress
            value={((step + 1) / 3) * 100}
            aria-label={`Étape ${step + 1} sur 3`}
            className="mt-5 h-1.5 bg-cream [&_[data-slot=progress-indicator]]:bg-coral"
          />
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
                  tone: "coral",
                },
                {
                  value: "helper" as Role,
                  icon: UsersRound,
                  title: "Je veux aider",
                  text: "Proposer mon temps, mes compétences ou du matériel.",
                  tone: "teal",
                },
                {
                  value: "both" as Role,
                  icon: Heart,
                  title: "Les deux",
                  text: "Je peux avoir un besoin tout en aidant à mon tour.",
                  tone: "sun",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={role === option.value}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 text-left transition",
                    role === option.value
                      ? "border-ink bg-ink text-white shadow-md"
                      : "border-ink/8 bg-white hover:border-ink/20 hover:bg-cream/50",
                  )}
                  onClick={() => setRole(option.value)}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      role === option.value
                        ? "bg-white/12 text-white"
                        : option.tone === "coral"
                          ? "bg-coral/10 text-coral"
                          : option.tone === "teal"
                            ? "bg-teal/10 text-teal"
                            : "bg-sun/30 text-terracotta",
                    )}
                  >
                    <option.icon className="size-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{option.title}</span>
                    <span
                      className={cn(
                        "mt-1 block text-sm leading-5",
                        role === option.value
                          ? "text-white/65"
                          : "text-muted-foreground",
                      )}
                    >
                      {option.text}
                    </span>
                  </span>
                  {role === option.value && <Check className="size-5" />}
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
                const Icon = categoryIcons[item] ?? Heart;
                return (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={category === item}
                    className={cn(
                      "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center text-sm font-medium transition",
                      category === item
                        ? "border-teal bg-teal text-white shadow-md"
                        : "border-ink/8 bg-white text-ink hover:border-teal/25 hover:bg-teal/5",
                    )}
                    onClick={() => setCategory(item)}
                  >
                    <Icon className="size-5" />
                    {item}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="onboarding-commune">Votre commune</Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="onboarding-commune"
                    autoComplete="address-level2"
                    value={commune}
                    onChange={(event) => setCommune(event.target.value)}
                    placeholder="Ex. Sainte-Hélène"
                    className="h-12 rounded-xl pl-10"
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-teal/6 p-4 text-sm leading-6 text-teal">
                <ShieldCheck className="mr-2 inline size-4" />
                Vous pourrez parcourir les annonces sans créer de compte.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 rounded-b-[1.6rem] border-ink/6 bg-cream/55 px-5 py-4 sm:px-7">
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft />
              Retour
            </Button>
          )}
          <Button
            type="button"
            className="h-11 rounded-xl bg-coral px-5 text-white hover:bg-coral/90"
            disabled={step === 2 && !commune.trim()}
            onClick={() => (step < 2 ? setStep(step + 1) : onFinish())}
          >
            {step < 2 ? "Continuer" : "Voir mes correspondances"}
            <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[1.6rem] p-0 sm:max-w-2xl">
        <form onSubmit={onSubmit}>
          <div className="px-5 pt-6 sm:px-7">
            <DialogHeader>
              <Badge className="mb-2 bg-coral/9 text-coral hover:bg-coral/9">
                <Heart />
                Nouvelle annonce
              </Badge>
              <DialogTitle className="text-2xl font-bold tracking-tight text-ink">
                Que souhaitez-vous partager ?
              </DialogTitle>
              <DialogDescription>
                Quelques informations suffisent. Votre email ne sera jamais
                affiché publiquement.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
            <div className="space-y-2 sm:col-span-2">
              <Label>Type d’annonce</Label>
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="Type d’annonce"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.kind === "need"}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                    form.kind === "need"
                      ? "border-coral bg-coral/8 text-coral"
                      : "border-ink/8 text-muted-foreground",
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
                    "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                    form.kind === "offer"
                      ? "border-teal bg-teal/8 text-teal"
                      : "border-ink/8 text-muted-foreground",
                  )}
                  onClick={() => update("kind", "offer")}
                >
                  Je propose mon aide
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-category">Catégorie</Label>
              <Select
                value={form.category}
                onValueChange={(value) => value && update("category", value)}
              >
                <SelectTrigger
                  id="publish-category"
                  className="h-11 w-full rounded-xl"
                >
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
              <Label htmlFor="publish-commune">Commune</Label>
              <Input
                id="publish-commune"
                required
                minLength={2}
                maxLength={120}
                autoComplete="address-level2"
                value={form.commune}
                onChange={(event) => update("commune", event.target.value)}
                placeholder="Ex. Le Temple"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publish-title">Titre de l’annonce</Label>
              <Input
                id="publish-title"
                required
                minLength={5}
                maxLength={100}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Ex. Une remorque pour déplacer des meubles"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publish-description">Quelques précisions</Label>
              <Textarea
                id="publish-description"
                aria-describedby="publish-public-warning"
                required
                minLength={15}
                maxLength={1_000}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Expliquez simplement le besoin, le matériel disponible et les éventuelles contraintes…"
                className="min-h-28 rounded-xl"
              />
              <p id="publish-public-warning" className="text-xs text-coral">
                N’écrivez aucune adresse précise, aucun téléphone, email ou lien
                dans le texte public.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-availability">Disponibilité</Label>
              <Input
                id="publish-availability"
                required
                maxLength={160}
                value={form.availability}
                onChange={(event) => update("availability", event.target.value)}
                placeholder="Ex. samedi matin"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-name">Votre prénom</Label>
              <Input
                id="publish-name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                placeholder="Prénom ou initiales"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publish-email">Votre email</Label>
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
                className="h-11 rounded-xl"
              />
              <p
                id="publish-email-help"
                className="text-xs text-muted-foreground"
              >
                Il servira à recevoir les réponses et le lien de gestion de
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
              className="rounded-2xl border border-ink/8 bg-cream/60 p-4 sm:col-span-2"
              aria-label="Aperçu public de l’annonce"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                Aperçu public
              </p>
              <h3 className="mt-2 font-semibold text-ink">
                {form.title || "Le titre de votre annonce"}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {form.description || "Votre description apparaîtra ici."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {form.commune || "Commune"} ·{" "}
                {form.availability || "Disponibilité"}
              </p>
            </aside>
          </div>

          <DialogFooter className="m-0 rounded-b-[1.6rem] px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-coral px-5 text-white hover:bg-coral/90"
            >
              {loading ? <LoaderCircle className="animate-spin" /> : <Heart />}
              Publier gratuitement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
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
      <DialogContent className="rounded-[1.6rem] p-0 sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <div className="px-5 pt-6 sm:px-7">
            <DialogHeader>
              <Badge
                className={cn(
                  "mb-2",
                  isNeed
                    ? "bg-coral/9 text-coral hover:bg-coral/9"
                    : "bg-teal/9 text-teal hover:bg-teal/9",
                )}
              >
                <MessageCircle />
                Contacter {announcement.firstName}
              </Badge>
              <DialogTitle className="text-xl font-bold tracking-tight text-ink">
                {announcement.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {announcement.commune}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-5 py-6 sm:px-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reply-name">Votre prénom</Label>
                <Input
                  id="reply-name"
                  name="firstName"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="given-name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-email">Votre email</Label>
                <Input
                  id="reply-email"
                  name="email"
                  type="email"
                  required
                  maxLength={320}
                  autoComplete="email"
                  aria-describedby="reply-email-help"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-message">Votre message</Label>
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
                className="min-h-28 rounded-xl"
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
              className="flex gap-2 text-xs leading-5 text-muted-foreground"
            >
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" />
              Votre adresse email sera transmise uniquement à cette personne
              pour qu’elle puisse vous répondre.
            </p>
          </div>

          <DialogFooter className="m-0 rounded-b-[1.6rem] px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "h-11 rounded-xl px-5 text-white",
                isNeed
                  ? "bg-coral hover:bg-coral/90"
                  : "bg-teal hover:bg-teal/90",
              )}
            >
              {loading ? <LoaderCircle className="animate-spin" /> : <Mail />}
              Envoyer mon message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
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
      <DialogContent className="rounded-[1.6rem] p-0 sm:max-w-md">
        <form onSubmit={onSubmit}>
          <div className="px-6 pt-7 text-center">
            <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <UserRound className="size-6" />
            </span>
            <DialogHeader className="mt-5">
              <DialogTitle className="text-2xl font-bold tracking-tight text-ink">
                Retrouvez facilement vos entraides
              </DialogTitle>
              <DialogDescription className="mx-auto max-w-sm leading-6">
                Pas de mot de passe. Recevez simplement un lien sécurisé par
                email.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="account-email">Votre email</Label>
              <Input
                id="account-email"
                name="email"
                type="email"
                required
                maxLength={320}
                autoComplete="email"
                placeholder="vous@exemple.fr"
                className="h-12 rounded-xl"
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
              className="h-12 w-full rounded-xl bg-teal text-white hover:bg-teal/90"
            >
              {loading ? <LoaderCircle className="animate-spin" /> : <Mail />}
              Recevoir mon lien de connexion
            </Button>
            <div className="grid gap-2 rounded-2xl bg-cream p-4 text-sm text-muted-foreground">
              {[
                "Retrouver et fermer vos annonces",
                "Lire les réponses reçues",
                "Supprimer vos données vous-même",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="size-3.5 text-teal" />
                  {item}
                </span>
              ))}
            </div>
            <p className="text-center text-[0.7rem] leading-5 text-muted-foreground">
              Le lien est personnel, utilisable une seule fois et expire après
              15 minutes.
            </p>
          </div>
        </form>
      </DialogContent>
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
      <DialogContent className="rounded-[1.6rem] p-0 sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <div className="px-6 pt-7">
            <DialogHeader>
              <Badge variant="outline" className="mb-2 w-fit text-coral">
                <Flag />
                Signalement
              </Badge>
              <DialogTitle className="text-xl font-bold text-ink">
                Signaler « {announcement.title} »
              </DialogTitle>
              <DialogDescription>
                L’annonce sera masquée automatiquement après plusieurs
                signalements indépendants, puis examinée.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="report-reason">Motif</Label>
              <Select name="reason" defaultValue="fraude" required>
                <SelectTrigger id="report-reason" className="w-full">
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
              <Label htmlFor="report-details">Précisions facultatives</Label>
              <Textarea
                id="report-details"
                name="details"
                maxLength={600}
                className="min-h-24"
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
          <DialogFooter className="m-0 rounded-b-[1.6rem] px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" /> : <Flag />}
              Transmettre le signalement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
