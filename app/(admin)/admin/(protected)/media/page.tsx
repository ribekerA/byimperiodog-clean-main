"use client";

import { Upload, Image as ImageIcon, Trash2, Download, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  file_path?: string;
}

const PAGE_SIZE = 60;

function mapMediaItems(items: Record<string, unknown>[]): MediaFile[] {
  return items.map((it) => ({
    id: (it["id"] as string) || (it["asset_id"] as string) || crypto.randomUUID(),
    name:
      (it["name"] as string) ||
      (it["file_name"] as string) ||
      (it["filename"] as string) ||
      (typeof it["file_path"] === "string" ? (it["file_path"] as string).split("/").pop() : undefined) ||
      "arquivo",
    url: (it["url"] as string) || (it["public_url"] as string) || (it["src"] as string) || "",
    size: Number((it["size"] as number) || 0),
    type: (it["type"] as string) || (it["mime_type"] as string) || "",
    uploadedAt: (it["created_at"] as string) || (it["uploaded_at"] as string) || new Date().toISOString(),
    file_path: it["file_path"] as string | undefined,
  }));
}

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPage = async (offset: number) => {
    const res = await fetch(`/api/admin/media?limit=${PAGE_SIZE}&offset=${offset}`, { cache: "no-store" });
    const json = await res.json();
    const items = Array.isArray(json) ? json : json.items || json.data || [];
    const mapped = mapMediaItems(items as Record<string, unknown>[]);
    setTotal(typeof json.total === "number" ? json.total : mapped.length);
    return mapped;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const mapped = await loadPage(0);
        setFiles(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const mapped = await loadPage(files.length);
      setFiles((prev) => [...prev, ...mapped]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    // Upload real via API existente
    for (const file of Array.from(uploadedFiles)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/blog/media/upload", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        const it = json?.asset || json?.data || json;
        const newFile: MediaFile = {
          id: it?.id || crypto.randomUUID(),
          name: it?.name || file.name,
          url: it?.url || it?.public_url || it?.src || "",
          size: Number(it?.size ?? file.size),
          type: it?.type || it?.mime_type || file.type,
          uploadedAt: it?.created_at || new Date().toISOString(),
          file_path: it?.file_path,
        };
        setFiles((prev) => [newFile, ...prev]);
        setTotal((t) => t + 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const target = files.find((f) => f.id === id);
    try {
      await fetch(`/api/admin/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, file_path: target?.file_path }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--brand)]">Biblioteca de Mídia</h1>
          <p className="mt-1 text-sm text-[var(--brand)]">
            Gerencie uploads, compressão e organize seus arquivos
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]">
          <Upload className="h-4 w-4" />
          Upload Arquivos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="sr-only"
          />
        </label>
      </header>

      <div className="rounded-2xl border border-[var(--brand-tint-100)] bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--brand)]">Carregando…</div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-16 w-16 text-[var(--brand-tint-300)]" />
            <h3 className="mt-4 text-lg font-semibold text-[var(--brand)]">Nenhum arquivo</h3>
            <p className="mt-2 text-sm text-[var(--brand)]">
              Faça upload de imagens para começar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-xl border border-[var(--brand-tint-100)] bg-[var(--brand-tint-50)] transition hover:border-[var(--brand)] hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-[var(--brand-tint-100)]">
                  {file.type.startsWith("image/") ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-[var(--brand)]" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="truncate text-sm font-medium text-[var(--brand)]">
                    {file.name}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--brand)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => handleCopyUrl(file.url, file.id)}
                    className="rounded-lg bg-white/90 p-2 text-[var(--brand)] transition hover:bg-white"
                    title="Copiar URL"
                  >
                    {copiedId === file.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={file.url}
                    download={file.name}
                    className="rounded-lg bg-white/90 p-2 text-[var(--brand)] transition hover:bg-white"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="rounded-lg bg-red-500/90 p-2 text-white transition hover:bg-red-600"
                    title="Deletar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && files.length > 0 && files.length < total && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs text-[var(--brand)]">{files.length} de {total} arquivos</p>
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full border border-[var(--brand-tint-200)] bg-white px-5 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-tint-50)] disabled:opacity-50"
            >
              {loadingMore ? "Carregando…" : "Carregar mais"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
