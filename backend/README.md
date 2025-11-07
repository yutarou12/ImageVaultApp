# ImageVaultApp backend

Minimal TypeScript Express backend for ImageVaultApp. It provides the `/api` endpoints the frontend expects and stores image metadata in `backend/data/images.json`.

Features
- Accepts file uploads via `POST /api/upload` (multipart/form-data, field name `file`).
- Stores uploaded files to Cloudflare R2 (S3-compatible) when R2 is configured. Otherwise falls back to local `backend/uploads/`.
- Metadata saved in `backend/data/images.json`.

Environment (R2)
- `R2_BUCKET_NAME` - required to enable R2 storage (or set `R2_ENABLED=true` and provide credentials).
- `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` - credentials for R2 (S3-compatible).
- `R2_ENDPOINT` - optional endpoint URL for R2 (e.g. `https://<account-id>.r2.cloudflarestorage.com`).
- `R2_PUBLIC_URL` - optional public base URL to construct direct object links (e.g. `https://<bucket>.<your-zone>.r2.cloudflarestorage.com`).

If R2 is not configured or upload fails, the server falls back to saving files locally under `backend/uploads/`.

API (matches frontend expectations in `frontend/src/api.ts`)
- GET `/api/images` -> JSON array of saved images
- POST `/api/upload` -> Accepts `file` form field; returns saved metadata
- GET `/api/download/:id` -> Streams file (attachment)
- GET `/api/thumbnail/:id` -> Redirects to thumbnail or serves file inline
- DELETE `/api/images/:id` -> Deletes metadata and file

Run (development)
1. cd backend
2. pnpm install (or npm install)
3. set environment variables (or create `.env`)
4. pnpm run dev

- The server will try to upload to R2 when `R2_BUCKET_NAME` and credentials are provided. If R2 upload fails the server falls back to local storage.
- The backend is intentionally minimal to integrate quickly with the frontend; extend with a proper DB or authentication as needed.
