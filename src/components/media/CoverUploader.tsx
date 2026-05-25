// PATH: src/components/media/CoverUploader.tsx
"use client";

import { UploadCloud, Loader2, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/adminFetch";
import { cn } from "@/lib/cn";

type Aspect = "16:9" | "4:3" | "1:1";

type CoverUploaderProps = {
  value?: string;
  altValue?: string | null;
  onChange: (url: string | null) => void;
  onAltChange?: (alt: string) => void;
  aspect?: Aspect;
  maxSizeMB?: number;
  postId?: string;
  disabled?: boolean;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const aspectToDimensions: Record<Aspect, { width: number; height: number; label: string }> = {
  "16:9": { width: 1200, height: 675, label: "1200 x 675" },
  "4:3": { width: 1200, height: 900, label: "1200 x 900" },
  "1:1": { width: 1200, height: 1200, label: "1200 x 1200" },
};

export default function CoverUploader({
  value,
  altValue,
  onChange,
  onAltChange,
  aspect = "16:9",
  maxSizeMB = 6,
  postId,
  disabled,
}: CoverUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [alt, setAlt] = useState(altValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectPreview, setObjectPreview] = useState<string | null>(null);

  const dims = aspectToDimensions[aspect];
  const previewUrl = objectPreview || value || null;

  useEffect(() => {
    setAlt(altValue ?? "");
  }, [altValue]);

  useEffect(() => () => {
    if (objectPreview) URL.revokeObjectURL(objectPreview);
  }, [objectPreview]);

  function openPicker() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  function validateFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error("Formato não suportado. Use JPG, PNG, WebP ou AVIF.");
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      throw new Error(`Arquivo acima de ${maxSizeMB}MB.`);
    }
  }

  async function handleUpload(file: File) {
    setError(null);
    validateFile(file);
    if (!alt.trim()) {
      throw new Error("Texto alternativo obrigatório antes de enviar.");
    }
    try {
      setUploading(true);
      const tempUrl = URL.createObjectURL(file);
      setObjectPreview(tempUrl);
      const form = new FormData();
      form.set("file", file);
      form.set("role", "cover");
      form.set("alt", alt.trim());
      if (postId) form.set("post_id", postId);
      const response = await adminFetch("/api/admin/blog/media/upload", {
        method: "POST",
        body: form,
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Falha no upload da capa");
      }
      const url: string | undefined = payload?.url;
      if (!url) {
        throw new Error("Retorno inválido do servidor");
      }
      onChange(url);
      setObjectPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await handleUpload(file);
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      setObjectPreview(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled || uploading) return;
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    try {
      await handleUpload(file);
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      setObjectPreview(null);
    }
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function clearCover() {
    if (disabled) return;
    onChange(null);
    setObjectPreview(null);
  }

  const helperText = useMemo(() => `${dims.label} | ${aspect.replace(":", "×")} | até ${maxSizeMB}MB`, [aspect, dims.label, maxSizeMB]);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="cover-alt" className="text-xs font-medium text-[var(--text)]">
          Texto alternativo (ALT)
        </label>
        <Input
          id="cover-alt"
          value={alt}
          onChange={(event) => {
            setAlt(event.target.value);
            onAltChange?.(event.target.value);
          }}
          placeholder="Descreva a imagem para leitores de tela"
          maxLength={140}
          required
          aria-required
          disabled={disabled || uploading}
        />
        <span className="text-[11px] text-[var(--text-muted)]">Obrigatório • {alt.trim().length}/140 caracteres</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text)]">Imagem de capa ({aspect})</label>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          onClick={openPicker}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={cn(
            "relative flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
            aspect === "4:3" && "aspect-[4/3]",
            aspect === "1:1" && "aspect-square",
            (disabled || uploading) && "cursor-not-allowed opacity-80"
          )}
          aria-label="Selecionar imagem de capa"
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={alt || "Pré-visualização da capa"}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <ImageIcon className="h-6 w-6" aria-hidden />}
              <span className="text-xs font-medium">Clique ou arraste uma imagem</span>
              <span className="text-[11px] text-[var(--text-muted)]">{helperText}</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={onFileChange}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{helperText}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={openPicker} disabled={disabled || uploading}>
              <UploadCloud className="mr-1 h-3.5 w-3.5" aria-hidden />
              {uploading ? "Enviando..." : "Definir como capa"}
            </Button>
            {previewUrl && (
              <Button variant="ghost" size="sm" type="button" onClick={clearCover} disabled={disabled || uploading}>
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden /> Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}



