import React from "react";
import { type ImageMeta, downloadImage, deleteImage } from "../api";

type Props = {
  meta: ImageMeta;
  onDeleted?: (id: string) => void;
};

export default function ImageCard({ meta, onDeleted }: Props) {
  const handleDownload = () => {
    downloadImage(meta.id);
  };

  const handleDelete = async () => {
    if (!confirm("この画像を削除しますか？")) return;
    await deleteImage(meta.id);
    onDeleted?.(meta.id);
  };

  // show thumbnail via /api/thumbnail/:id or directly via download endpoint with content-disposition inline
  const src = `/api/thumbnail/${meta.id}`;

  return (
    <div className="image-card">
      <div className="thumb-wrap">
        <img src={src} alt={meta.name} />
      </div>
      <div className="meta">
        <div className="name" title={meta.name}>
          {meta.name}
        </div>
        <div className="actions">
          <button onClick={handleDownload}>ダウンロード</button>
          <button onClick={handleDelete}>削除</button>
        </div>
      </div>
    </div>
  );
}
