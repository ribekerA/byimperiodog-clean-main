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

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/media", { cache: "no-store" });
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.items || json.data || [];
        type Raw = Record<string, unknown>;
        const mapped: MediaFile[] = (items as Raw[]).map((it) => ({
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
        setFiles(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Biblioteca de Mídia</h1>
          <p className="mt-1 text-sm text-emerald-700">
            Gerencie uploads, compressão e organize seus arquivos
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
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

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-emerald-700">Carregando…</div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-16 w-16 text-emerald-200" />
            <h3 className="mt-4 text-lg font-semibold text-emerald-900">Nenhum arquivo</h3>
            <p className="mt-2 text-sm text-emerald-600">
              Faça upload de imagens para começar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50 transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-emerald-100">
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
                      <ImageIcon className="h-12 w-12 text-emerald-400" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="truncate text-sm font-medium text-emerald-900">
                    {file.name}
                  </h4>
                  <p className="mt-1 text-xs text-emerald-600">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => handleCopyUrl(file.url, file.id)}
                    className="rounded-lg bg-white/90 p-2 text-emerald-900 transition hover:bg-white"
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
                    className="rounded-lg bg-white/90 p-2 text-emerald-900 transition hover:bg-white"
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
      </div>
    </div>
  );
}
