import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";

import { announcementForManagement } from "@/lib/announcement-repository";
import { hashToken } from "@/lib/security";
import { ManagementActions } from "@/components/management-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusTag } from "@/components/status-tag";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ token: string }> };

export default async function ManageAnnouncementPage({ params }: PageProps) {
  const { token } = await params;
  const data = await announcementForManagement(hashToken(token));
  if (!data) notFound();
  const { announcement, responses } = data;

  return (
    <>
      <SiteHeader />
      <main id="contenu" className="site-container min-h-[60vh] py-8 md:py-12">
        <nav aria-label="Fil d’Ariane">
          <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-muted-foreground">
            <li>
              <Link href="/" className="text-link">
                Accueil
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-ink">
              Gestion de mon annonce
            </li>
          </ol>
        </nav>

        <h1 className="section-title mt-8">Gérer mon annonce</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-7 text-muted-foreground">
          Cette page privée vous permet de suivre les réponses reçues, de
          marquer l’annonce comme résolue ou de la supprimer. Conservez ce lien,
          il tient lieu d’accès.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <article className="border border-line border-t-4 border-t-blue-france bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag status={announcement.status} />
              <span className="inline-flex items-center bg-alt px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                {announcement.category}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-extrabold tracking-[-0.02em] text-ink">
              {announcement.title}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-[1rem] leading-7 text-muted-foreground">
              {announcement.description}
            </p>
            <dl className="mt-5 grid gap-2 border-t border-line pt-5 text-[0.9375rem] text-ink">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Commune</dt>
                <MapPin
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <dd className="font-medium">{announcement.commune}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Disponibilité</dt>
                <CalendarDays
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <dd>{announcement.availability}</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-line pt-5">
              <ManagementActions
                endpoint={`/api/manage/${token}`}
                status={announcement.status}
              />
            </div>
          </article>

          <section aria-labelledby="reponses-title">
            <h2
              id="reponses-title"
              className="text-xl font-extrabold tracking-[-0.02em] text-ink"
            >
              Réponses reçues ({responses.length})
            </h2>
            <div className="mt-4 grid gap-3">
              {responses.length === 0 ? (
                <p className="border border-line bg-alt p-5 text-[0.9375rem] text-muted-foreground">
                  Aucune réponse pour le moment. Vous recevrez un email dès
                  qu’une personne vous répond.
                </p>
              ) : (
                responses.map((response) => (
                  <article
                    key={response.id}
                    className="border border-line border-l-4 border-l-blue-france bg-white p-5"
                  >
                    <h3 className="font-bold text-ink">{response.firstName}</h3>
                    <a
                      className="text-link text-[0.875rem]"
                      href={`mailto:${response.email}`}
                    >
                      {response.email}
                    </a>
                    <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-6 text-muted-foreground">
                      {response.message}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
