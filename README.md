# ImageVaultApp

Simple image vault web application (frontend + minimal backend).

## Overview
- Frontend: Vite + React + TypeScript SPA in `frontend/`. Uses Material UI (MUI) for styling and Axios for API calls.
- Backend: TypeScript + Express in `backend/`. Minimal server implementing the API the frontend expects and storing image metadata in `backend/data/images.json`.
- Storage: Cloudflare R2 (S3-compatible) is supported for uploaded image storage; the server falls back to local `backend/uploads/` when R2 isn't configured or upload fails.

## Key features
- Upload images (multipart/form-data)
- Paginated/blocked display of images in the UI (groups of 10 per row)
- Thumbnail preview and full download
- Delete images (removes object from R2 or local storage and deletes metadata)
- MUI-based UI with per-image menu (3-dot) exposing download/delete and click-to-preview dialog

## API contract (frontend expects)
- GET /api/images -> ImageMeta[]
- POST /api/upload -> accepts `file` form field, returns saved ImageMeta
- GET /api/download/:id -> stream/download
- GET /api/thumbnail/:id -> returns or redirects to a small preview
- DELETE /api/images/:id -> delete

## Data shapes
- ImageMeta (frontend `frontend/src/api.ts`)
  - id: string (R2 object key or local id)
  - name: string
  - mimeType: string
  - size: number
  - createdTime?: string

## Environment & configuration
- Frontend: none special. Run from `frontend/`.
- Backend environment variables (place in `backend/.env` or export in shell):
  - R2_BUCKET_NAME - name of your Cloudflare R2 bucket (required to enable R2)
  - R2_ACCESS_KEY_ID - access key id for R2
  - R2_SECRET_ACCESS_KEY - secret key for R2
  - R2_ENDPOINT - S3-compatible endpoint (optional; e.g. https://<account-id>.r2.cloudflarestorage.com)
  - R2_PUBLIC_URL - optional public URL base for generating direct links (thumbnail redirects)
  - PORT - backend port (default 3000)

## Developer workflows
- Install dependencies (recommended pnpm):
  - cd frontend && pnpm install
  - cd backend && pnpm install
- Run dev servers (two terminals):
  - cd backend && pnpm run dev
  - cd frontend && pnpm run dev

- Build production frontend:
  - cd frontend && pnpm run build

- Lint frontend:
  - cd frontend && pnpm run lint

## Notes & conventions
- The frontend's API base is `/api` (see `frontend/src/api.ts`). If you run the backend on a different port in development, either configure Vite proxy in `frontend/vite.config.ts` or run backend on the same origin to avoid CORS.
- Uploads use `multipart/form-data` with the field name `file`.
- Thumbnails served from `/api/thumbnail/:id` and full file from `/api/download/:id`.
- Metadata is stored in `backend/data/images.json` (simple JSON array). Replace with a real DB for production.
- UI strings contain some Japanese text; keep translations consistent if editing copy.

## Where to look in the code
- Frontend
  - `frontend/src/api.ts` — API client and ImageMeta type
  - `frontend/src/components/Bookshelf.tsx` — main gallery flow and chunking (groups of 10)
  - `frontend/src/components/ImageCard.tsx` — card UI, preview dialog and menu actions
  - `frontend/package.json`, `vite.config.ts` — scripts and build config
- Backend
  - `backend/src/index.ts` — Express routes and storage logic (R2 integration)
  - `backend/src/db.ts` — tiny JSON-backed metadata store
  - `backend/README.md` — backend-specific notes

## Security & deployment notes
- Do NOT commit secret keys into source control. Use `.env` (ignored) or your platform's secret storage for deployment.
- For production, prefer using authenticated uploads, a proper database, and signed URLs for R2 objects (or configure restricted access via Cloudflare and Worker-based signed URLs).

## Want help?
- I can add a Vite proxy snippet, a sample R2 upload test script, CI steps, or convert the metadata store to SQLite. Tell me which you'd like next.

## License
- MIT