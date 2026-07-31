#!/bin/sh
set -eu

backup_directory="${BACKUP_DIRECTORY:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_directory"

docker compose exec -T postgres pg_dump \
  --username="${POSTGRES_USER:-france_solidaire}" \
  --dbname="${POSTGRES_DB:-france_solidaire}" \
  --format=custom \
  > "${backup_directory}/france-solidaire-${timestamp}.dump"

find "$backup_directory" -type f -name 'france-solidaire-*.dump' -mtime +14 -delete
echo "Sauvegarde créée : ${backup_directory}/france-solidaire-${timestamp}.dump"
