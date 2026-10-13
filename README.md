# Dibidani — frontend

Application Angular du marché Dibidani, servie par Nginx (gzip, cache des assets, en-têtes de sécurité, reverse proxy `/api` et `/uploads`).

## Démarrage Docker

Depuis ce dossier (avec `backend-dibidani-1` en frère) ou depuis le parent `dibidani/` :

```powershell
Copy-Item .env.example .env
docker compose up --build
```

- Site : http://localhost
- Santé Nginx : http://localhost/health

Documentation : [docs/DEPLOY.md](docs/DEPLOY.md) · Jenkins : [docs/JENKINS.md](docs/JENKINS.md)

## Production

PostgreSQL n’est **pas** exposé. Seul Nginx (port 80) est public.

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Développement local (sans Docker)

```bash
npm ci
npm start
```

L’API doit tourner sur http://localhost:8080.
