import React, { useEffect, useState } from "react";
import { listImages, uploadImage, type ImageMeta } from "../api";
import ImageCard from "./ImageCard";
import { Box, Button, Container, Grid, Typography, CircularProgress, Stack, Divider } from "@mui/material";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function Bookshelf() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [uploading, setUploading] = useState(false);

  async function fetchImages() {
    const list = await listImages();
    setImages(list);
  }

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const meta = await uploadImage(f);
        setImages((prev) => [meta, ...prev]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleted = (id: string) => setImages((prev) => prev.filter((p) => p.id !== id));

  const groups = chunk(images, 6);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Bookshelf Image Service</Typography>
        <label>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Button variant="contained" component="span">
            Upload images
          </Button>
        </label>
        {uploading && <CircularProgress size={24} />}
      </Stack>

      {images.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography>画像がありません。アップロードしてください。</Typography>
        </Box>
      ) : (
        <Box>
          {groups.map((g, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 3,
                pb: 2,
                // shelf-like underline for each row
                borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
              }}
            >
              <Grid container spacing={2} alignItems="stretch">
                {g.map((img) => (
                  <Grid item key={img.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                    <ImageCard key={img.id} meta={img} onDeleted={handleDeleted} />
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
}
