import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import stream from "stream";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getAll, save, remove, find, StoredImage } from "./db";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
// Cloudflare R2 / S3-compatible configuration
const R2_ENABLED = process.env.R2_ENABLED === "true" || !!process.env.R2_BUCKET_NAME;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT; // e.g. https://<account-id>.r2.cloudflarestorage.com
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // optional public URL base for constructing direct links

let s3: S3Client | null = null;
if (R2_ENABLED && R2_BUCKET) {
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKey || !secretKey) {
    console.warn("R2 is enabled but R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing. R2 disabled.");
  } else {
    s3 = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: R2_ENDPOINT,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    });
    console.log("R2 (S3) integration enabled for bucket:", R2_BUCKET);
  }
} else {
  console.log("R2 integration disabled (no R2_BUCKET_NAME)");
}

const app = express();

app.use(express.json());

// allow CORS from same-origin frontend during dev if needed
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
  next();
});

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/images
app.get("/api/images", async (req, res) => {
  const list = await getAll();
  res.json(list);
});

// POST /api/upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "no file" });
  // Try uploading to R2 (S3-compatible) when configured
  if (s3 && R2_BUCKET) {
    try {
      const key = `${Date.now()}-${file.originalname}`;
      const put = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await s3.send(put);

      const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${encodeURIComponent(key)}` : undefined;
      const stored: StoredImage = {
        id: key,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        createdTime: new Date().toISOString(),
        source: "r2",
        r2Key: key,
        publicUrl,
      };
      await save(stored);
      return res.json(stored);
    } catch (err) {
      console.error("R2 upload failed, falling back to local storage:", (err as any)?.message ?? err);
    }
  }

  // fallback: save to local uploads folder
  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const localId = `local-${Date.now()}`;
  const filename = `${localId}-${file.originalname}`;
  const localPath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(localPath, file.buffer);

  const stored: StoredImage = {
    id: localId,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    source: "local",
    localPath,
  };
  await save(stored);
  res.json(stored);

});

// GET /api/download/:id
app.get("/api/download/:id", async (req, res) => {
  const id = req.params.id;
  const entry = await find(id);
  if (!entry) return res.status(404).send("not found");

  if (entry.source === "local" && entry.localPath) {
    return res.sendFile(entry.localPath);
  }

  if (entry.source === "r2" && s3 && entry.r2Key) {
    try {
      const get = new GetObjectCommand({ Bucket: R2_BUCKET, Key: entry.r2Key });
      const r = await s3.send(get);
      res.setHeader("Content-Type", entry.mimeType ?? "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${entry.name}"`);
      const body = r.Body as any;
      if (body && typeof body.pipe === "function") {
        (body as stream.Readable).pipe(res);
      } else if (body && Symbol.asyncIterator in Object(body)) {
        // for async iterable body
        for await (const chunk of body) {
          res.write(Buffer.from(chunk));
        }
        res.end();
      } else {
        // fallback: send buffer
        const buf = await new Promise<Buffer>((resolve, reject) => {
          const chunks: any[] = [];
          if (!body) return resolve(Buffer.alloc(0));
          body.on("data", (c: any) => chunks.push(c));
          body.on("end", () => resolve(Buffer.concat(chunks)));
          body.on("error", reject);
        });
        res.end(buf);
      }
    } catch (e) {
      const err = e as any;
      console.error("s3.getObject error:", err?.message ?? err);
      if (err?.$metadata?.httpStatusCode === 404 || /NoSuchKey|NotFound/i.test(err?.message ?? "")) {
        return res.status(404).send("file not found on R2");
      }
      res.status(500).send("failed to download from R2");
    }
    return;
  }

  res.status(400).send("unsupported source");
});

// GET /api/thumbnail/:id  -> redirect to thumbnailLink or download (inline)
app.get("/api/thumbnail/:id", async (req, res) => {
  const id = req.params.id;
  const entry = await find(id);
  if (!entry) return res.status(404).send("not found");

  if (entry.source === "local" && entry.localPath) {
    // serve the same file (frontend expects small thumbnail ideally)
    res.setHeader("Content-Type", entry.mimeType ?? "image/*");
    return res.sendFile(entry.localPath);
  }

  if (entry.source === "r2") {
    if (entry.publicUrl) return res.redirect(entry.publicUrl);
    // otherwise use download as inline
    return res.redirect(`/api/download/${id}`);
  }

  res.status(400).send("unsupported source");
});

// DELETE /api/images/:id
app.delete("/api/images/:id", async (req, res) => {
  const id = req.params.id;
  const entry = await find(id);
  if (!entry) return res.status(404).json({ error: "not found" });

  if (entry.source === "r2" && s3 && entry.r2Key) {
    try {
      const del = new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: entry.r2Key });
      await s3.send(del);
    } catch (e) {
      const err = e as any;
      if (err?.$metadata?.httpStatusCode === 404 || /NoSuchKey|NotFound/i.test(err?.message ?? "")) {
        console.warn("R2 object not found during delete, removing metadata anyway", entry.r2Key);
      } else {
        console.warn("failed to delete object from R2", err?.message ?? err);
      }
    }
  }

  if (entry.source === "local" && entry.localPath) {
    try {
      await fs.promises.unlink(entry.localPath);
    } catch (e) {
      // ignore
    }
  }

  await remove(id);
  res.json({ ok: true });
});

app.get("/", (req, res) => res.send("ImageVaultApp backend"));

app.listen(PORT, () => {
  console.log(`backend listening on http://localhost:${PORT}`);
});
