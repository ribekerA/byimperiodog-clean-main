"use client";

import { Upload, X, Image as ImageIcon, Video, GripVertical, Star } from "lucide-react";
import { useState } from "react";

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  file?: File;
  order: number;
};

type Props = {
  photos: MediaItem[];
  videos: MediaItem[];
  onPhotosChange: (photos: MediaItem[]) => void;
  onVideosChange: (videos: MediaItem[]) => void;
  onPhotoDelete?: (url: string) => void;
  onVideoDelete?: (url: string) => void;
};

export function MediaManager({
  photos,
  videos,
  onPhotosChange,
  onVideosChange,
  onPhotoDelete,
  onVideoDelete,
}: Props) {
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file, index) => ({
      id: `new-photo-${Date.now()}-${index}`,
      type: "image" as const,
      url: URL.createObjectURL(file),
      file,
      order: photos.length + index,
    }));
    onPhotosChange([...photos, ...newPhotos]);
  };

  // Video upload handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newVideos = files.map((file, index) => ({
      id: `new-video-${Date.now()}-${index}`,
      type: "video" as const,
      url: URL.createObjectURL(file),
      file,
      order: videos.length + index,
    }));
    onVideosChange([...videos, ...newVideos]);
  };

  // Photo drag handlers
  const handlePhotoDragStart = (index: number) => {
    setDraggedPhotoIndex(index);
  };

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPhotoIndex === null || draggedPhotoIndex === index) return;

    const newPhotos = [...photos];
    const draggedItem = newPhotos[draggedPhotoIndex];
    newPhotos.splice(draggedPhotoIndex, 1);
    newPhotos.splice(index, 0, draggedItem);
    onPhotosChange(newPhotos.map((p, i) => ({ ...p, order: i })));
    setDraggedPhotoIndex(index);
  };

  const handlePhotoDragEnd = () => {
    setDraggedPhotoIndex(null);
  };

  // Video drag handlers
  const handleVideoDragStart = (index: number) => {
    setDraggedVideoIndex(index);
  };

  const handleVideoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedVideoIndex === null || draggedVideoIndex === index) return;

    const newVideos = [...videos];
    const draggedItem = newVideos[draggedVideoIndex];
    newVideos.splice(draggedVideoIndex, 1);
    newVideos.splice(index, 0, draggedItem);
    onVideosChange(newVideos.map((v, i) => ({ ...v, order: i })));
    setDraggedVideoIndex(index);
  };

  const handleVideoDragEnd = () => {
    setDraggedVideoIndex(null);
  };

  // Remove photo
  const removePhoto = (id: string, url: string) => {
    if (url.startsWith("http") || url.startsWith("https")) {
      onPhotoDelete?.(url);
    }
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  // Remove video
  const removeVideo = (id: string, url: string) => {
    if (url.startsWith("http") || url.startsWith("https")) {
      onVideoDelete?.(url);
    }
    onVideosChange(videos.filter((v) => v.id !== id));
  };

  // Set photo as cover (move to index 0)
  const setAsCover = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    const photo = newPhotos.splice(index, 1)[0];
    newPhotos.unshift(photo);
    onPhotosChange(newPhotos.map((p, i) => ({ ...p, order: i })));
  };

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Photos Section */}
      <div className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <ImageIcon className="h-5 w-5 text-emerald-600" aria-hidden />
            Fotos ({photos.length})
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-emerald-600 px-[var(--space-3)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-1)] transition hover:bg-emerald-700 hover:shadow-[var(--elevation-2)] focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
            <Upload className="h-4 w-4" aria-hidden />
            Upload Fotos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="sr-only"
              aria-label="Fazer upload de fotos"
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-[var(--space-6)] py-[var(--space-12)] text-center">
            <ImageIcon className="mb-3 h-12 w-12 text-[var(--text-muted)]" aria-hidden />
            <p className="text-sm font-semibold text-[var(--text)]">Nenhuma foto adicionada</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Clique no botão &ldquo;Upload Fotos&rdquo; para adicionar imagens
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[var(--space-3)] sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handlePhotoDragStart(index)}
                onDragOver={(e) => handlePhotoDragOver(e, index)}
                onDragEnd={handlePhotoDragEnd}
                className={`group relative cursor-move overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--elevation-1)] transition hover:shadow-[var(--elevation-3)] ${
                  draggedPhotoIndex === index ? "opacity-50" : ""
                }`}
              >
                <div className="aspect-square">
                  <img
                    src={photo.url}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>

                {/* Order indicator or cover star */}
                <div
                  className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-[var(--radius-full)] text-xs font-bold text-white shadow-[var(--elevation-2)] ${
                    index === 0 ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                >
                  {index === 0 ? <Star className="h-4 w-4 fill-white" aria-hidden /> : index + 1}
                </div>

                {/* Set as cover button (only show if not already cover) */}
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsCover(index)}
                    className="absolute left-2 bottom-2 rounded-[var(--radius-md)] bg-amber-500 p-1.5 text-white shadow-[var(--elevation-2)] opacity-0 transition hover:bg-amber-600 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                    aria-label="Definir como capa"
                    title="Definir como capa"
                  >
                    <Star className="h-4 w-4" aria-hidden />
                  </button>
                )}

                {/* Drag handle */}
                <div className="absolute right-2 top-2 rounded-[var(--radius-md)] bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="h-4 w-4 text-white" aria-hidden />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id, photo.url)}
                  className="absolute bottom-2 right-2 rounded-[var(--radius-md)] bg-rose-600 p-1.5 text-white shadow-[var(--elevation-2)] opacity-0 transition hover:bg-rose-700 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  aria-label={`Remover foto ${index + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          💡 Arraste e solte para reordenar. A primeira foto (com estrela ⭐) será a capa do filhote.
        </p>
      </div>

      {/* Videos Section */}
      <div className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <Video className="h-5 w-5 text-blue-600" aria-hidden />
            Vídeos ({videos.length})
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-[var(--space-3)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-1)] transition hover:bg-blue-700 hover:shadow-[var(--elevation-2)] focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
            <Upload className="h-4 w-4" aria-hidden />
            Upload Vídeos
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="sr-only"
              aria-label="Fazer upload de vídeos"
            />
          </label>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-[var(--space-6)] py-[var(--space-12)] text-center">
            <Video className="mb-3 h-12 w-12 text-[var(--text-muted)]" aria-hidden />
            <p className="text-sm font-semibold text-[var(--text)]">Nenhum vídeo adicionado</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Clique no botão &ldquo;Upload Vídeos&rdquo; para adicionar vídeos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2 md:grid-cols-3">
            {videos.map((video, index) => (
              <div
                key={video.id}
                draggable
                onDragStart={() => handleVideoDragStart(index)}
                onDragOver={(e) => handleVideoDragOver(e, index)}
                onDragEnd={handleVideoDragEnd}
                className={`group relative cursor-move overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--elevation-1)] transition hover:shadow-[var(--elevation-3)] ${
                  draggedVideoIndex === index ? "opacity-50" : ""
                }`}
              >
                <div className="aspect-video">
                  <video
                    src={video.url}
                    controls
                    className="h-full w-full object-cover"
                  >
                    Seu navegador não suporta vídeos.
                  </video>
                </div>

                {/* Order indicator */}
                <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-[var(--radius-full)] bg-blue-600 text-xs font-bold text-white shadow-[var(--elevation-2)]">
                  {index + 1}
                </div>

                {/* Drag handle */}
                <div className="absolute right-2 top-2 rounded-[var(--radius-md)] bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="h-4 w-4 text-white" aria-hidden />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeVideo(video.id, video.url)}
                  className="absolute bottom-2 right-2 rounded-[var(--radius-md)] bg-rose-600 p-1.5 text-white shadow-[var(--elevation-2)] opacity-0 transition hover:bg-rose-700 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  aria-label={`Remover vídeo ${index + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          💡 Arraste e solte para reordenar. Formatos suportados: MP4, WebM, MOV.
        </p>
      </div>
    </div>
  );
}
