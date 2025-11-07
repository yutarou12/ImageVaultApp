## ImageVaultApp — quick instructions for AI coding agents

This file contains concise, repository-specific guidance so an AI coding agent can be productive immediately.

High-level architecture
- Frontend is a Vite + React + TypeScript single-page app in `frontend/`.
- Backend is expected to provide JSON + file endpoints under the `/api` path (see `frontend/src/api.ts`). The repository's `backend/` folder is present but currently contains no server implementation; the frontend expects an API at the same origin or a configured dev proxy.

Key files to read first
- `frontend/package.json` — dev/build scripts (dev: `vite`, build: `tsc -b && vite build`).
- `frontend/src/api.ts` — canonical list of API endpoints the frontend calls (GET `/api/images`, POST `/api/upload`, GET `/api/download/:id`, DELETE `/api/images/:id`, GET `/api/thumbnail/:id`). Use this file to discover the data shape and integration points.
- `frontend/src/components/Bookshelf.tsx` and `frontend/src/components/ImageCard.tsx` — main UI flows (fetching list, uploading, deleting, thumbnail vs. download). These show state mutation patterns and UX text (Japanese strings).
- `frontend/vite.config.ts` — Vite config (no dev proxy defined). If running backend separately in dev, add a proxy here or run backend on the same origin.

Data shapes & examples
-- The frontend's ImageMeta type is defined in `frontend/src/api.ts`:
  - id: string (local id or R2 object key)
  - name: string
  - mimeType: string
  - size: number
  - createdTime?: string
- Example usage: `listImages()` returns `ImageMeta[]`; `uploadImage(file)` returns a single `ImageMeta` which callers insert into UI state.

Developer workflows (what to run)
- Install deps: prefer pnpm (repo contains `pnpm-lock.yaml`).
  - `pnpm install` at `frontend/` root.
- Start dev server: `pnpm run dev` (runs `vite`). If the backend is run separately, configure Vite proxy or ensure backend is served at `/api`.
- Build for production: `pnpm run build` (runs `tsc -b && vite build`). Note: `tsc -b` runs TypeScript project builds configured by `tsconfig.*.json`.
- Preview built app: `pnpm run preview`.
- Lint: `pnpm run lint` runs eslint across the frontend.

Conventions and patterns specific to this repo
- API base: frontend code uses axios with `baseURL: '/api'`. Implement server endpoints under `/api` or configure a dev proxy in `vite.config.ts`.
- Uploads use multipart/form-data (see `uploadImage` in `frontend/src/api.ts`). Respect this when implementing backend upload handlers.
- Thumbnails: UI shows thumbnails from `/api/thumbnail/:id` but downloads via `/api/download/:id`. If implementing storage, serve small thumbnails for `thumbnail` and full file for `download` (content-disposition inline or attachment as appropriate).
- UI strings: some text is in Japanese (e.g., empty state and buttons). Keep translations consistent if adding i18n.
- State updates: components use optimistic insertion of uploaded items (Bookshelf inserts returned ImageMeta at the front). Deletion triggers parent callback to remove items from local state.

Edge/behavior notes discovered in code
- No client-side authorization headers are attached by default (`withCredentials: false`). Backend auth (if any) must be compatible with this. If cookies or credentials are required, update the axios instance.
- No explicit proxy defined in `vite.config.ts`. When running backend locally on a different port, add a `server.proxy` section or run the backend under the same host to avoid CORS issues.

Testing & CI
- No tests or CI config detectable. When adding tests, prefer placing them under `frontend/` and wiring scripts in `package.json`.

When changing or adding server endpoints
- Update `frontend/src/api.ts` to reflect any new paths or response shapes.
- Keep `ImageMeta` compatible unless you update every consumer in `frontend/src/components/`.

Where to look for follow-up details
- UI flows: `frontend/src/components/Bookshelf.tsx`, `ImageCard.tsx`.
- API contract: `frontend/src/api.ts` (single source of truth for frontend expectations).
- Build/deps: `frontend/package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, and `vite.config.ts`.

If anything here is unclear or you'd like a different level of detail (examples for Vite proxy config, a sample backend handler for `/api/upload`, or additional checks to run), tell me which section to expand and I'll iterate.
