# Terra Prime

LARP event management system built with SvelteKit, MySQL, and Docker.

## Tech Stack

| Layer       | Technology                        |
| :---------- | :-------------------------------- |
| Frontend    | SvelteKit 2, Svelte 5, TypeScript |
| 3D/Graphics | Three.js, Threlte                 |
| Runtime     | Node.js 24                        |
| Database    | MySQL 8.0+                        |
| Real-time   | WebSocket (ws)                    |
| Containers  | Docker + Docker Compose           |
| Package mgr | pnpm                              |

---

## Prerequisites

Install the following before starting:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js 24+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation)

```bash
# Verify versions
docker --version        # 24+
node --version          # v24+
pnpm --version          # 9+
```

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd terra-prime
```

### 2. Install dependencies

```bash
cd site
pnpm install
```

### 3. Configure environment

Create a `.env` file in the `site/` directory:

```env
MYSQLHOST=localhost
MYSQLPORT=3307
MYSQLUSER=yodi
MYSQLPASSWORD=Tester@123
MYSQLDATABASE=testaliceDB
```

> When running via Docker Compose, these values are already set in `compose.yml`. The `.env`
> file is only needed for running the app outside of Docker (e.g. `pnpm dev` on the host).

---

## Running with Docker Compose (recommended)

This spins up all services — database, migrations, and the dev server — in the correct order.

```bash
# From the project root
docker compose up
```

Services started:

| Service    | URL / Port            | Description                      |
| :--------- | :-------------------- | :------------------------------- |
| sveltekit  | http://localhost:5173 | SvelteKit dev server             |
| db         | localhost:3307        | MySQL 8 database                 |
| phpMyAdmin | http://localhost:8081 | Database admin UI                |
| migrate    | —                     | One-off migration runner (exits) |

The `migrate` container runs automatically and exits when all migrations are applied. The
`sveltekit` container waits for migrations to complete before starting.

To rebuild containers after dependency or Dockerfile changes:

```bash
docker compose up --build
```

To stop and remove containers:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

## Container Architecture

The `site/dockerfile` uses multi-stage builds:

| Stage            | Purpose                                           |
| :--------------- | :------------------------------------------------ |
| `base`           | Node 24-slim base with pnpm via Corepack          |
| `prod-deps`      | Installs production dependencies only             |
| `build`          | Full build (dev + prod deps, runs `pnpm build`)   |
| `dev`            | Dev server target — runs `pnpm host` on port 5173 |
| `migrate-runner` | Runs migrations only, then exits                  |
| `final`          | Production image — runs `node ./build/index.js`   |

The `compose.yml` targets the `dev` stage for local development and `migrate-runner` for the
migration service.

---

## Database Migrations

Migrations are plain `.sql` files in `site/db/migrations/`, applied in alphabetical order.
The `_migrations` table tracks which files have already been applied, so re-running is safe.

### Run migrations manually (host)

```bash
cd site
pnpm migrate
```

### Run migrations manually (Docker)

```bash
docker compose run --rm migrate
```

### Adding a new migration

Create a new file following the naming convention:

```
site/db/migrations/0002_your_description.sql
```

The file is applied automatically on the next `docker compose up` or `pnpm migrate` run.

### Seed the database

```bash
# Host
cd site
pnpm seed

# Docker
docker compose run --rm -e MYSQLHOST=db sveltekit pnpm seed
```

---

## Running the Dev Server (without Docker)

If you prefer to run the app on the host against a locally running MySQL instance:

```bash
# Start only the database
docker compose up db -d

# From site/
pnpm dev
```

The app is then available at http://localhost:5173.

---

## Useful Commands

```bash
# Tail all container logs
docker compose logs -f

# Tail a specific service
docker compose logs -f sveltekit

# Open a shell in the running app container
docker compose exec sveltekit sh

# Connect to MySQL from the host
mysql -h 127.0.0.1 -P 3307 -u yodi -p testaliceDB
```

---

## Project Structure

```
terra-prime/
├── compose.yml              # Docker Compose configuration
├── site/                    # Main SvelteKit application
│   ├── dockerfile           # Multi-stage Docker build
│   ├── src/
│   │   ├── routes/          # SvelteKit pages and API endpoints (/api/*)
│   │   └── lib/
│   │       ├── components/  # Reusable Svelte components
│   │       ├── managers/    # Frontend state (*.svelte.ts, Svelte 5 runes)
│   │       ├── services/    # Backend business logic (*.service.ts)
│   │       ├── db/          # Database query helpers
│   │       ├── types/       # TypeScript types
│   │       ├── utils/       # Utility functions
│   │       └── validators/  # Input validation
│   └── db/
│       ├── migrate.ts       # Migration runner
│       ├── seed.ts          # Database seeder
│       └── migrations/      # SQL migration files
├── docs/                    # Additional documentation
├── google-sheets/           # Google Sheets integration
└── stemtest/                # Component test project
```
