import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Mentions légales" };

export default function LegalNoticesPage() {
  const operator =
    process.env.SERVICE_OPERATOR_NAME ?? "Responsable à renseigner avant ouverture";
  const email =
    process.env.SERVICE_CONTACT_EMAIL ?? "contact@france-solidaire.fr";
  const host = process.env.HOSTING_PROVIDER_NAME ?? "Hébergeur VPS à renseigner";
  return (
    <LegalPage title="Mentions légales">
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Éditeur du service</h2>
        <p>
          {operator}
          <br />
          Contact :{" "}
          <a className="text-link" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Hébergement</h2>
        <p>{host}</p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">
          Règles d’utilisation
        </h2>
        <p>
          France Solidaire met gratuitement des particuliers en relation. Les
          offres commerciales, demandes d’argent, contenus frauduleux et
          interventions nécessitant un professionnel qualifié sont interdits.
          En cas d’urgence, contactez les services publics compétents.
        </p>
      </section>
    </LegalPage>
  );
}
