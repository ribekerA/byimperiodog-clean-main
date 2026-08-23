"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  onChange: (dataUrl: string | null) => void;
  label?: string;
}

export default function SignaturePad({ onChange, label = "Assinatura digital" }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawing    = useRef(false);
  const lastPos    = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty,  setIsEmpty]  = useState(true);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const src  = "touches" in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!canvasRef.current) return;
    drawing.current = true;
    lastPos.current = getPos(e.nativeEvent, canvasRef.current);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx  = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const pos  = getPos(e.nativeEvent, canvasRef.current);
    const prev = lastPos.current ?? pos;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();

    lastPos.current = pos;
    if (isEmpty) {
      setIsEmpty(false);
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function endDraw() {
    drawing.current = false;
    lastPos.current = null;
    if (canvasRef.current && !isEmpty) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  }

  if (!mounted) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-700">{label}</p>
        {!isEmpty && (
          <button type="button" onClick={clear}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition">
            <RefreshCcw className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      <div className={`relative overflow-hidden rounded-xl border-2 transition ${
        isEmpty ? "border-dashed border-zinc-200 bg-zinc-50" : "border-emerald-300 bg-white"
      }`}>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-zinc-300 select-none">Assine aqui com o mouse ou dedo</p>
          </div>
        )}
      </div>

      {isEmpty && (
        <p className="text-xs text-rose-500">A assinatura é obrigatória para validar o contrato.</p>
      )}
      {!isEmpty && (
        <p className="text-xs text-emerald-600">✓ Assinatura registrada.</p>
      )}
    </div>
  );
}
