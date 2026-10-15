# Déploiement Dibidani

Stack : Nginx (entrée publique) → Spring Boot → PostgreSQL 16.

Redis n’est **pas** utilisé : les jetons d’accès JWT sont stateless, les refresh tokens et le panier connecté sont en PostgreSQL. Un Redis ne serait utile que pour un rate-limit partagé entre plusieurs instances d’API.

La stack canonique se lance depuis le dossier parent `dibidani/` (ce dépôt et `backend-dibidani-1` en frères). On peut aussi lancer ce `docker-compose.yml` depuis ce dossier.

## Prérequis

- Docker Engine 24+ et Docker Compose v2
- Un fichier `.env` (jamais dans Git)

PowerShell :

```powershell
Copy-Item .env.example .env
# Éditer POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGINS, PUBLIC_URL
```

Bash :

```bash
cp .env.example .env
```

Générer des secrets :

```bash
openssl rand -base64 48
```

## Développement (PostgreSQL uniquement sur localhost)

```bash
docker compose up --build
```

- Site : http://localhost
- Santé Nginx : http://localhost/health
- API (debug local) : http://127.0.0.1:8080/actuator/health
- PostgreSQL : `127.0.0.1:5434` (pas d’écoute publique)

Arrêt :

```bash
docker compose down
```

Les volumes `dibidani_pgdata` et `dibidani_uploads` sont conservés. Pour tout effacer :

```bash
docker compose down -v
```

## Production

PostgreSQL et le backend **n’ont aucun port publié**. Seul Nginx (port 80) est accessible. Le réseau `data` est `internal` : Postgres n’a pas d’accès Internet et n’est joignable que par l’API.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Vérifications :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -fsS http://localhost/health
curl -fsS http://localhost/api/v1/public/settings
```

Mise à jour manuelle :

```bash
git pull
git -C ../backend-dibidani-1 pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**VPS (nginx-proxy)** : [VPS.md](VPS.md). Jenkins pousse `oliverqueen18/dibidani-frontend` — [JENKINS.md](JENKINS.md).

Journaux :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100
```

## Sauvegardes

PostgreSQL (volume `dibidani_pgdata`) :

```bash
docker compose exec db pg_dump -U dibidani dibidani > backup.sql
```

Restauration :

```bash
docker compose exec -T db psql -U dibidani dibidani < backup.sql
```

Images uploadées : volume `dibidani_uploads`.

## Variables d’environnement

| Variable | Rôle |
|---|---|
| `POSTGRES_PASSWORD` | Mot de passe base (obligatoire) |
| `JWT_SECRET` | Clé HMAC des jetons (≥ 32 octets) |
| `CORS_ORIGINS` | Origines navigateur, séparées par des virgules |
| `PUBLIC_URL` | URL publique (QR codes, retours de paiement) |
| `BACKEND_IMAGE` | Tag Docker API (Jenkins) ; défaut `dibidani-backend:local` |
| `FRONTEND_IMAGE` | Tag Docker Nginx (Jenkins) ; défaut `dibidani-frontend:local` |
| `SEED_DEMO_DATA` | Données de démo (forcé à `false` en prod) |
| `PAYMENT_MOCK_ENABLED` | Passerelle de test (forcé à `false` en prod) |

Les clés Orange Money / Moov Money ne doivent jamais être écrites dans les fichiers versionnés.

## HTTPS

Placer un reverse proxy TLS (Caddy, Traefik ou Nginx + Let’s Encrypt) devant le service `frontend`, et régler :

```
PUBLIC_URL=https://dibidani.com
CORS_ORIGINS=https://dibidani.com
```

Le backend honore `X-Forwarded-Proto` (profil `prod`) pour les cookies Secure. Activer HSTS uniquement derrière TLS.

## Santé

| Cible | Chemin |
|---|---|
| Nginx | `GET /health` |
| API (interne / localhost en dev) | `GET /actuator/health` |
| `/actuator/` depuis Internet | refusé par Nginx |

## Nginx

- Reverse proxy `/api/` et `/uploads/` vers `backend:8080`
- gzip
- cache 7 jours des assets statiques, 30 jours des uploads
- SPA `index.html` sans cache
- En-têtes : `X-Content-Type-Options`, `X-Frame-Options`, CSP, `Referrer-Policy`, `Permissions-Policy`
