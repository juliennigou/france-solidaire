# Contribuer à France Solidaire

Merci de vouloir améliorer France Solidaire. Les contributions utiles,
bienveillantes et centrées sur les besoins des personnes sinistrées sont les
bienvenues.

## Avant de commencer

- recherchez une issue existante avant d’en créer une nouvelle ;
- pour un changement important, ouvrez d’abord une issue décrivant le besoin ;
- ne publiez jamais de données personnelles réelles dans une issue, un test ou
  une capture d’écran ;
- les failles de sécurité doivent suivre la procédure de `SECURITY.md`.

## Installation

```bash
git clone https://github.com/juliennigou/france-solidaire.git
cd france-solidaire
cp .env.example .env
npm ci
npm run db:migrate
npm run dev
```

Une instance PostgreSQL est nécessaire pour les écritures. Pour travailler
uniquement sur l’interface, configurez `DEMO_MODE=true`.

## Proposer un changement

1. Créez une branche courte et descriptive depuis `main`.
2. Ajoutez ou adaptez les tests correspondant au changement.
3. Exécutez les vérifications locales.
4. Ouvrez une pull request expliquant le besoin, la solution et les tests.

```bash
npm run check
npm run test:e2e
```

Les changements de schéma doivent inclure une migration Drizzle. Les nouvelles
variables d’environnement doivent être documentées dans `.env.example` sans
contenir de secret.

## Principes du projet

- compte facultatif et parcours simples ;
- données personnelles privées par défaut ;
- aucun faux succès lorsqu’un service est indisponible ;
- accessibilité clavier et mobile ;
- interventions dangereuses réservées aux professionnels qualifiés ;
- dépendances et architecture adaptées à un petit VPS.
