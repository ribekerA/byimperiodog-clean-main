"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";

import { AdminButton } from "@/components/admin/ui/button";
import { showAdminToast } from "@/components/admin/ui/toast";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const MAX_SIZE_MB = 8;

type FileUploaderProps = {
  onUpload: (file: File, croppedBlob?: Blob) => Promise<void> | void;
};

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const next = acceptedFiles[0];
    if (!next) return;
    if (!ACCEPTED_TYPES.includes(next.type)) {
      showAdminToast({ title: "Formato inválido", description: "Use PNG, JPG, WebP ou AVIF.", variant: "error" });
      return;
    }
    if (next.size > MAX_SIZE_MB * 1024 * 1024) {
      showAdminToast({ title: "Arquivo muito grande", description: `Máximo de ${MAX_SIZE_MB} MB.`, variant: "error" });
      return;
    }
    setFile(next);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: ACCEPTED_TYPES.reduce<Record<string, string[]>>((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    onDrop,
  });

  async function handleUpload() {
    if (!file) return;
    await onUpload(file, croppedBlob ?? undefined);
    showAdminToast({ title: "Upload concluído", variant: "success" });
    setFile(null);
  }

  return (
    <section className="space-y-4">
      <div
        {...getRootProps()}
        className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <input {...getInputProps()} aria-label="Selecionar arquivos" />
        <p className="text-sm text-emerald-700">
          {isDragActive ? "Solte o arquivo aqui" : "Arraste e solte ou clique para escolher uma imagem (PNG, JPG, WebP, AVIF)"}
        </p>
        <p className="mt-1 text-xs text-emerald-500">Tamanho máximo: {MAX_SIZE_MB} MB</p>
      </div>

      {file ? (
        <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm lg:grid-cols-[320px,1fr]">
          <div className="relative h-64 w-full">
            <Cropper
              image={URL.createObjectURL(file)}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={async (_area, pixels) => {
                const image = await createImageBitmap(file);
                const canvas = document.createElement("canvas");
                canvas.width = pixels.width;
                canvas.height = pixels.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(
                  image,
                  pixels.x,
                  pixels.y,
                  pixels.width,
                  pixels.height,
                  0,
                  0,
                  pixels.width,
                  pixels.height,
                );
                canvas.toBlob((blob) => setCroppedBlob(blob), "image/jpeg", 0.92);
              }}
            />
          </div>
          <div className="flex flex-col justify-between">
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <strong>Arquivo:</strong> {file.name}
              </p>
              <p>
                <strong>Tamanho:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <AdminButton variant="outline" onClick={() => setFile(null)}>
                Cancelar
              </AdminButton>
              <AdminButton onClick={handleUpload}>Enviar</AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
