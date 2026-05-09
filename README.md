# Pokémon Collections

A small full-stack web application for building and managing custom Pokémon collections, validated against species and weight rules. Built as a test assignment.

---

## Features

- Browse the full PokeAPI Pokémon catalog with **search** and pagination
- Create collections by selecting Pokémon, with **live validation indicators** (species count, total weight, name)
- Save, view, and delete collections
- **Download** a saved collection as a JSON file
- **Upload** a previously saved file to recreate a collection
- Server-side enforcement of business rules:
  - ≥ 3 different Pokémon species
  - Total weight ≤ 1300 hg

---

## Tech Stack

| Layer         | Technology                                | Why                                                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Backend       | Node.js 20 + **NestJS** (TypeScript)      | Modular structure, DI out of the box, good fit for a REST API with clear domain layering. |
| Frontend      | **React 19** (TypeScript), bundled w/ Vite | CRA is officially deprecated; Vite gives faster startup and HMR.                          |
| Server state  | **TanStack Query**                        | Caching, retries, loading/error states for free — most of the UI is server data.          |
| Database      | **MongoDB 7** + Mongoose                  | A collection of Pokémon items per list maps naturally to embedded documents.              |
| Styling       | **Tailwind CSS v4**                       | Rapid UI iteration without naming bikeshedding.                                            |
| HTTP client   | Axios                                     | Nicer error handling than `fetch` (errors thrown as exceptions, type-safe responses).     |
| Validation    | `class-validator` + `class-transformer`   | Declarative DTO validation, integrates with NestJS `ValidationPipe`.                      |
| Containers    | Docker + docker compose                    | One-command bootstrap; matches the assignment's preferred entry point.                    |

---

## Quick Start (Docker)

Requires Docker Desktop running.

```bash
docker compose up --build
```

Then open:

- App:  http://localhost:5173
- API:  http://localhost:3000

To stop:

```bash
docker compose down       # keep DB data
docker compose down -v    # also wipe MongoDB volume
```

---

## Local Development (without Docker)

### Prerequisites
- Node.js ≥ 20
- A running MongoDB instance (`docker run -d --name pokemon-mongo -p 27017:27017 mongo:7` is the easiest path)

### Backend

```bash
cd backend
npm install
cp .env
npm run start:dev
```

`backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/pokemon-collections
PORT=3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

App runs on http://localhost:5173.

---

## API

Base URL: `http://localhost:3000`

| Method | Path                          | Body                              | Description                       |
| ------ | ----------------------------- | --------------------------------- | --------------------------------- |
| GET    | `/pokemon-lists`              | —                                 | List all saved collections        |
| GET    | `/pokemon-lists/:id`          | —                                 | Get a single collection           |
| POST   | `/pokemon-lists`              | `{ name, pokemons: [{ pokeId }] }` | Create a collection (validated)   |
| DELETE | `/pokemon-lists/:id`          | —                                 | Delete a collection               |
| GET    | `/pokemon-lists/:id/download` | —                                 | Download collection as a JSON file |

### Validation errors

The backend rejects invalid lists with `400 Bad Request`:

- DTO-level: missing/short name, fewer than 3 entries, more than 50 entries, non-numeric `pokeId`.
- Business-rule: fewer than 3 **distinct** species, total weight > 1300 hg.
- PokeAPI: unknown `pokeId` returns a 400 with the offending id.

---

## Project Structure

```
pokemon-collections/
├── backend/
│   ├── src/
│   │   ├── main.ts                     # App bootstrap, ValidationPipe, CORS
│   │   ├── app.module.ts               # Mongo + module wiring
│   │   ├── pokeapi/                    # External PokeAPI client (DI-injected service)
│   │   └── pokemon-lists/              # Domain module
│   │       ├── dto/
│   │       ├── schemas/
│   │       ├── *.controller.ts
│   │       └── *.service.ts            # CRUD + business-rule validation + export
│   └── Dockerfile                      # Multi-stage build → slim runtime
├── frontend/
│   ├── src/
│   │   ├── api/                        # Backend + PokeAPI clients
│   │   ├── components/ConfirmDialog.tsx
│   │   ├── pages/                      # MainPage / CreateListPage / ViewListPage
│   │   ├── types/
│   │   ├── utils/                      # useDebounce, typeColor
│   │   └── App.tsx
│   ├── Dockerfile                      # Build → nginx runtime
│   └── nginx.conf                      # SPA fallback
├── docker-compose.yml
└── README.md
```

---

## Architectural Decisions

### 1. Business rules live on the server

The two list rules (≥ 3 species, ≤ 1300 hg) are enforced in `PokemonListsService.create()`. The frontend mirrors them for live feedback, but the client check is purely UX — the server is authoritative. Tampering with the request body cannot bypass the rules.

### 2. The backend re-fetches Pokémon details from PokeAPI on save

The frontend sends only `pokeId`s. The backend resolves names, weights, sprites and types from PokeAPI before persisting. Two reasons:

- **Integrity** — clients cannot lie about a Pokémon's weight to bypass the 1300 hg rule.
- **Single source of truth** — PokeAPI is the canonical reference; we don't duplicate it.

The cost is one extra round of HTTP per save, mitigated by parallel `Promise.all` and a `pokemons` array capped at 50 entries (`@ArrayMaxSize`).

### 3. The catalog and search hit PokeAPI directly from the frontend

For browsing, the backend would just be a proxy. PokeAPI is CORS-enabled and fast, so the frontend calls it directly and lets the browser cache. The backend is involved only when persisting.

Search uses a one-time fetch of the full Pokémon name index (~1300 names, ~150 KB), filtered in memory with a debounced input. Detail requests fire only for matches actually shown.

### 4. Atomic save semantics

If any single PokeAPI lookup during save fails, the entire save is rejected. We never persist a partial list — that could violate the species or weight rule unnoticed. The error message identifies the offending `pokeId`.

### 5. Upload re-uses the create endpoint

There is no `/upload` endpoint. The frontend reads the file, parses it, extracts `name` and `pokeId`s, and POSTs to `/pokemon-lists` like any other create. This keeps a single validation path (DRY) and avoids `multer` middleware.

### 6. MongoDB embedded documents

A `PokemonList` document embeds its `PokemonItem`s rather than referencing them. They are always read together and Pokémon items have no meaning outside a list. Embedded docs avoid joins and keep the read shape simple.

### 7. Two-layer validation

- **DTO layer** (form / structural): `class-validator` decorators reject malformed bodies before any business logic runs (fail-fast). Examples: `@IsString`, `@ArrayMinSize(3)`, `@ArrayMaxSize(50)`.
- **Service layer** (semantic / domain): rules that need data or computation — distinct-species check, total weight, PokeAPI existence.

### 8. React Query as server-state manager

Lists, list details, the PokeAPI catalog, the index for search, and search results are all `useQuery`s. Mutations (create, delete) invalidate the relevant cache keys, so the UI stays consistent without manual refetches.

### 9. Multi-stage Docker builds

Both backend and frontend Dockerfiles use two stages — a builder image with the full toolchain, and a slim runtime image (Alpine for backend, nginx for frontend statics). The frontend final image has no Node runtime at all; it serves pre-built static files behind nginx, with a `try_files … /index.html` SPA fallback.

### 10. SPA fallback in nginx

`location / { try_files $uri $uri/ /index.html; }` — without this, hard-refresh on any route other than `/` would return a 404 from nginx (the file doesn't exist), and React Router never gets a chance to handle the URL.

---

## Notes & Limitations

- **Search** matches by substring on Pokémon name (PokeAPI doesn't expose a search endpoint).
- **No authentication** — all collections are global. Adding users would need an auth layer and per-user filtering.
- **No pagination on the saved-lists page** — it loads all collections. Fine at this scale; for large datasets, switch to cursor-based pagination.
- **No optimistic UI updates** — deletes wait for the server response and then invalidate. Optimistic updates would feel snappier but add complexity for marginal gain at this scope.
