// PATH: src/components/media/InlineImagePicker.tsx
"use client";

import { UploadCloud, Loader2 } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/adminFetch";
import { cn } from "@/lib/cn";

export type InlineImage = {
  url: string;
  alt: string;
  caption?: string | null;
  width?: number;
  height?: number;
};

type InlineImagePickerProps = {
  onSelect: (image: InlineImage) => void;
  postId?: string;
  disabled?: boolean;
  helperText?: string;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

async function readDimensions(src: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth || undefined, height: img.naturalHeight || undefined });
    img.onerror = () => resolve({});
    img.src = src;
  });
}

export default function InlineImagePicker({ onSelect, postId, disabled, helperText }: InlineImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const helper = useMemo(() => helperText || "Enviar imagens otimizadas (WebP/AVIF). ALT obrigatório." , [helperText]);

  function validate(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error("Formato não suportado para imagens inline.");
    }
    if (file.size / (1024 * 1024) > 5) {
      throw new Error("Limite de 5MB por imagem inline.");
    }
  }

  async function handleUpload(file: File) {
    setError(null);
    validate(file);
    if (!alt.trim()) throw new Error("Informe um texto alternativo.");
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("role", "inline");
      form.set("alt", alt.trim());
      if (caption.trim()) form.set("caption", caption.trim());
      if (postId) form.set("post_id", postId);
      const response = await adminFetch("/api/admin/blog/media/upload", {
        method: "POST",
        body: form as any,
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Falha ao enviar imagem");
      const remoteUrl: string | undefined = json?.url;
      if (!remoteUrl) throw new Error("Resposta inválida do servidor");
      const meta = await readDimensions(remoteUrl);
      onSelect({
        url: remoteUrl,
        alt: alt.trim(),
        caption: caption.trim() || null,
        width: meta.width,
        height: meta.height,
      });
      reset();
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setAlt("");
    setCaption("");
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await handleUpload(file);
    } catch (err: any) {
      setError(err?.message || "Erro desconhecido");
      setPreviewUrl(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="inline-image" className="text-xs font-medium text-[var(--text)]">
            Selecionar imagem
          </label>
          <Input
            ref={inputRef}
            id="inline-image"
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={onFileChange}
            disabled={disabled || uploading}
          />
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">{helper}</p>
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="inline-alt" className="text-xs font-medium text-[var(--text)]">
            Texto alternativo (ALT)
          </label>
          <Input
            id="inline-alt"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Descreva o que aparece na imagem"
            maxLength={140}
            required
            aria-required
            disabled={disabled || uploading}
          />
          <span className="text-[11px] text-[var(--text-muted)]">{alt.trim().length}/140 caracteres</span>
        </div>
        <div className="w-full sm:max-w-xs">
          <label htmlFor="inline-caption" className="text-xs font-medium text-[var(--text)]">
            Legenda (opcional)
          </label>
          <textarea
            id="inline-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={2}
            maxLength={220}
            placeholder="Legenda exibida abaixo da imagem"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || uploading}
          />
        </div>
      </div>

      <div
        className={cn(
          "relative flex min-h-[140px] w-full items-center justify-center overflow-hidden rounded border border-dashed border-[var(--border)] bg-[var(--surface)]",
          uploading && "opacity-80"
        )}
      >
        {previewUrl ? (
          <NextImage
            src={previewUrl}
            alt={alt || "Pré-visualização"}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <UploadCloud className="h-6 w-6" aria-hidden />}
            <span className="text-xs">A prévia aparece após selecionar o arquivo</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Enviando...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" aria-hidden /> Adicionar ao conteúdo
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}




