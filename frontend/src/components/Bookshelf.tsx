import React, { useEffect, useState } from "react";
import { listImages, uploadImage, type ImageMeta } from "../api";
import ImageCard from "./ImageCard";

export default function Bookshelf() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [uploading, setUploading] = useState(false);

  async function fetch() {
    const list = await listImages();
    setImages(list);
  }

  useEffect(() => {
    fetch();
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

  const handleDeleted = (id: string) =>
    setImages((prev) => prev.filter((p) => p.id !== id));

  return (
    <div>
      <div className="toolbar">
        <label className="upload-btn">
          Upload images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </label>
        {uploading && <div className="status">Uploading...</div>}
      </div>

      <div className="bookshelf">
        {images.length === 0 && (
          <div className="empty">
            画像がありません。アップロードしてください。
          </div>
        )}
        <div className="shelf-row">
          {images.map((img) => (
            <ImageCard key={img.id} meta={img} onDeleted={handleDeleted} />
          ))}
        </div>
      </div>
    </div>
  );
}
