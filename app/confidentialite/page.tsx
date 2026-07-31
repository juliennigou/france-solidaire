import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  const contact =
    process.env.PRIVACY_CONTACT_EMAIL ?? "confidentialite@france-solidaire.fr";
  return (
    <LegalPage title="Politique de confidentialité">
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Données collectées</h2>
        <p>
          Nous collectons les informations nécessaires à la mise en relation :
          prénom, email, commune, contenu des annonces et messages. L’adresse
          email n’est jamais affichée publiquement. Les données techniques
          utilisées pour limiter les abus sont immédiatement transformées en
          empreintes non réversibles.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Finalités</h2>
        <p>
          Ces données servent uniquement à publier et gérer les annonces,
          transmettre les réponses, assurer la sécurité du service et traiter
          les signalements. Elles ne sont ni vendues ni utilisées pour de la
          publicité.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">
          Durées de conservation
        </h2>
        <p>
          Une annonce expire après 90 jours. Une annonce expirée ou fermée et
          ses réponses sont supprimées au plus tard 30 jours plus tard. Les
          liens de connexion expirent après 15 minutes, les sessions après
          30 jours, les liens de validation des réponses après 30 minutes, les
          données de limitation après 24 heures et les emails envoyés après
          30 jours.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Vos droits</h2>
        <p>
          Vous pouvez gérer ou supprimer une annonce grâce au lien privé reçu
          par email. Pour exercer vos droits d’accès, rectification,
          opposition ou effacement, écrivez à{" "}
          <a className="text-link" href={`mailto:${contact}`}>
            {contact}
          </a>
          . Une réponse vous sera apportée dans les délais légaux.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Destinataires</h2>
        <p>
          Le propriétaire d’une annonce reçoit le prénom, l’email et le message
          de la personne qui répond. L’hébergeur du VPS, PostgreSQL et le
          fournisseur SMTP peuvent traiter des données uniquement pour faire
          fonctionner le service.
        </p>
      </section>
    </LegalPage>
  );
}
