import React from "react";
import { type ImageMeta, downloadImage, deleteImage } from "../api";
import { Card, CardMedia, CardContent, IconButton, Menu, MenuItem, Typography, Box, Dialog, DialogContent } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';

type Props = {
  meta: ImageMeta;
  onDeleted?: (id: string) => void;
};

export default function ImageCard({ meta, onDeleted }: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleDownload = () => {
    handleMenuClose();
    downloadImage(meta.id);
  };

  const handlePreviewOpen = () => setPreviewOpen(true);
  const handlePreviewClose = () => setPreviewOpen(false);

  const handleDelete = async () => {
    handleMenuClose();
    if (!confirm("この画像を削除しますか？")) return;
    await deleteImage(meta.id);
    onDeleted?.(meta.id);
  };

  const src = `http://localhost:3000/api/thumbnail/${meta.id}`;

  return (
    <>
    <Card sx={{ position: 'relative', width: '100%', maxWidth: 360 }}>
      <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2 }}>
        <IconButton size="small" onClick={handleMenuOpen} aria-label="menu">
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          <MenuItem onClick={handleDownload}>
            <DownloadIcon sx={{ mr: 1 }} /> ダウンロード
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <DeleteIcon sx={{ mr: 1 }} /> 削除
          </MenuItem>
        </Menu>
      </Box>

      <CardMedia component="img" height="220" image={src} alt={meta.name} sx={{ objectFit: 'cover', cursor: 'pointer' }} onClick={handlePreviewOpen} />
      <CardContent>
        <Typography variant="body2" noWrap title={meta.name}>
          {meta.name}
        </Typography>
      </CardContent>
    </Card>
    <Dialog open={previewOpen} onClose={handlePreviewClose} maxWidth="lg">
      <DialogContent sx={{ p: 0, backgroundColor: '#000' }}>
        <img src={src} alt={meta.name} style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '80vh' }} />
      </DialogContent>
    </Dialog>
    </>
  );
}
