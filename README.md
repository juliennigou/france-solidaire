# France Solidaire

[![CI](https://github.com/juliennigou/france-solidaire/actions/workflows/ci.yml/badge.svg)](https://github.com/juliennigou/france-solidaire/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-2563eb.svg)](LICENSE)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933.svg)](https://nodejs.org/)

Plateforme citoyenne qui met en relation les personnes ayant besoin d’aide et
les bénévoles proches de chez elles. Le compte est facultatif : une annonce
peut être publiée sans connexion et reste gérable grâce à un lien privé envoyé
par email.

Le projet est open source et peut être déployé par une collectivité, une
association ou un collectif citoyen sur son propre VPS.

> France Solidaire facilite l’entraide de proximité. La plateforme ne remplace
> ni les services d’urgence, ni les professionnels qualifiés pour les
> interventions dangereuses.

## Fonctionnalités

- publication d’une demande ou d’une proposition d’aide sans compte obligatoire ;
- recherche par commune, catégorie, type d’annonce et mots-clés ;
- réponse avec confirmation de l’adresse email avant transmission ;
- connexion sans mot de passe et tableau de bord personnel ;
- lien privé de gestion pour les personnes sans compte ;
- signalement communautaire et masquage automatique en cas d’abus ;
- file d’emails fiable, limitations anti-spam et minimisation des données ;
- interface responsive et accessible construite avec shadcn/ui.

## Direction artistique

L’interface reprend les codes des services publics français — typographie
humaniste (Public Sans), bleu France `#000091`, formes carrées, champs de
saisie à fond gris et soulignement épais, contrastes AA — réchauffés par deux
couleurs de soutien : terre battue pour les besoins d’aide, émeraude pour les
propositions d’aide. Le bleu porte les actions et la structure, les tons chauds
portent le sens.

France Solidaire est une initiative citoyenne indépendante : ni la Marianne, ni
le bloc-marque « République Française », ni aucun emblème officiel ne sont
utilisés, et le pied de page le rappelle explicitement.

## Architecture

- Next.js App Router en serveur Node.js standalone ;
- React, TypeScript, Tailwind CSS et shadcn/ui ;
- PostgreSQL 17, avec Drizzle comme source unique du schéma ;
- file transactionnelle d’emails et worker SMTP avec reprises sur erreur ;
- Caddy pour HTTPS et reverse proxy ;
- Docker Compose pour le VPS ;
- tâche de maintenance pour les expirations et la minimisation des données.

Les anciennes couches Cloudflare Worker, vinext et D1 ont été retirées. Le
projet n’a plus qu’une seule cible de déploiement : un VPS Docker.

## Développement local

Prérequis : Node.js 22, npm et PostgreSQL.

```bash
cp .env.example .env
# Adaptez DATABASE_URL et les secrets dans .env
npm ci
npm run db:migrate
npm run dev
```

Pour travailler seulement sur l’interface sans PostgreSQL, ajoutez
`DEMO_MODE=true`. Les exemples seront visibles, mais toutes les écritures
renverront explicitement une indisponibilité : aucun faux succès n’est produit.

Pour prévisualiser les emails dans les logs, utilisez
`EMAIL_TRANSPORT=log` et lancez :

```bash
npm run email:worker
```

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Le test d’intégration nécessite une base migrée dédiée :

```bash
RUN_DATABASE_TESTS=true npm run test:integration
```

## Déploiement VPS

1. Pointez le DNS du domaine vers le VPS.
2. Installez Docker Engine et le plugin Compose.
3. Copiez `.env.example` vers `.env`.
4. Générez deux secrets longs et différents pour `POSTGRES_PASSWORD` et
   `RATE_LIMIT_SECRET`. Utilisez un mot de passe PostgreSQL alphanumérique ou
   base64url afin qu’il reste valide dans l’URL interne.
5. Configurez `DOMAIN`, `APP_URL`, SMTP et les mentions légales.
6. Vérifiez que seuls les ports `22`, `80` et `443` sont accessibles.
7. Démarrez :

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f app email-worker
```

L’application applique les migrations avant chaque démarrage. PostgreSQL reste
sur un réseau Docker interne et n’expose aucun port public. Caddy obtient et
renouvelle automatiquement le certificat TLS du domaine.

## Sauvegardes

Créer une sauvegarde PostgreSQL compressée :

```bash
BACKUP_DIRECTORY=/srv/backups/france-solidaire ./scripts/backup-postgres.sh
```

Planifiez cette commande chaque nuit avec le cron du VPS et copiez les
sauvegardes chiffrées hors du serveur. Testez régulièrement une restauration :

```bash
docker compose exec -T postgres pg_restore \
  --clean --if-exists \
  --username=france_solidaire \
  --dbname=france_solidaire \
  < sauvegarde.dump
```

## Fonctionnement des emails

Les routes ne prétendent jamais qu’un email a été livré. Elles insèrent
l’opération métier et l’email dans une seule transaction PostgreSQL. Le worker
SMTP traite ensuite la file, réessaie avec délai exponentiel et conserve un
état `pending`, `sending`, `sent` ou `failed`. Les réponses restent consultables
dans l’espace privé même si SMTP connaît une panne temporaire.

## Comptes et gestion

- connexion sans mot de passe avec un lien à usage unique valable 15 minutes ;
- vérification email des personnes qui répondent, sans imposer de compte ;
- session `HttpOnly`, `Secure`, `SameSite=Lax`, valable 30 jours ;
- lien privé de gestion pour les utilisateurs sans compte ;
- fermeture, réouverture et suppression des annonces ;
- tableau de bord des réponses reçues.

## Confiance et modération

- limites de taille et validation Zod côté serveur ;
- quotas par empreinte réseau, sans conserver l’adresse IP brute ;
- honeypots sur les écritures anonymes ;
- blocage des emails, téléphones, URLs et adresses précises dans le contenu
  public ;
- blocage de travaux nécessitant un professionnel assuré ;
- signalement effectif ; une annonce est masquée après trois signalements
  indépendants ;
- notification de modération via `MODERATION_EMAIL`.

## Conservation

- annonces : expiration après 90 jours ;
- annonces expirées/fermées et réponses : suppression 30 jours plus tard ;
- liens magiques : 15 minutes, purge après un jour ;
- réponses non confirmées : lien de 30 minutes, purge après un jour ;
- sessions : 30 jours ;
- données anti-abus : 24 heures ;
- emails envoyés : 30 jours.

La politique complète est exposée sur `/confidentialite`.

## Contribuer

Les contributions sont bienvenues : corrections, accessibilité, traductions,
documentation ou nouvelles fonctionnalités. Consultez
[CONTRIBUTING.md](CONTRIBUTING.md) avant d’ouvrir une pull request.

Pour signaler une vulnérabilité, n’ouvrez pas d’issue publique : suivez la
procédure décrite dans [SECURITY.md](SECURITY.md).

## Licence

France Solidaire est distribué sous [licence MIT](LICENSE). Vous pouvez
l’utiliser, le modifier et le redéployer, y compris pour un service local, en
conservant la notice de licence.
