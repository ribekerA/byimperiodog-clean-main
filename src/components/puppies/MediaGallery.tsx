"use client";
import React, { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { adminFetch } from '@/lib/adminFetch';
import { supabasePublic } from '@/lib/supabasePublic';
import { ALLOWED_IMAGE_MIME, ALLOWED_VIDEO_MIME, MAX_IMAGE_BYTES, MAX_GIF_BYTES, MAX_VIDEO_BYTES } from '@/lib/uploadValidation';

export interface MediaGalleryProps {
  media: string[];
  cover?: string;
  onChange: (list: string[]) => void;
  onSelectCover?: (url: string) => void;
  max?: number;
  className?: string;
  label?: string;
}

export default function MediaGallery({ media, cover, onChange, onSelectCover, max=6, className='', label='Galeria (até 6)' }: MediaGalleryProps){
  const { push } = useToast();
  const [progress,setProgress] = useState<Record<string,number>>({});
  const liveRef = React.useRef<HTMLDivElement|null>(null);

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const files = e.target.files; if(!files?.length) return; const remaining = Math.max(0, max - media.length); if(remaining===0){ push({ type:'error', message:`Limite de ${max} imagens`}); return; }
    const list = Array.from(files).slice(0, remaining);
    const newUrls:string[] = [];
    for(const f of list){
      try {
        // Validação rápida no cliente para evitar 413 e dar feedback imediato
        const isImg = ALLOWED_IMAGE_MIME.has(f.type);
        const isVid = ALLOWED_VIDEO_MIME.has(f.type);
        if(!isImg && !isVid){
          throw new Error(`Tipo não suportado: ${f.type || 'desconhecido'}`);
        }
  const max = isVid ? MAX_VIDEO_BYTES : (f.type === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES);
        if(f.size <= 0 || f.size > max){
          const mb = (max/1_000_000).toFixed(0);
          throw new Error(`Arquivo muito grande (${Math.ceil(f.size/1_000_000)}MB). Limite: ${mb}MB para ${isVid? 'vídeo':'imagem'}.`);
        }

        setProgress(p=>({...p,[f.name]:10}));
        const fd = new FormData();
        fd.append('file', f);
        fd.append('filename', f.name);
        fd.append('upsert', '0');
  const r = await adminFetch('/api/admin/puppies/upload', { method:'POST', body: fd });

        // Garantir retorno JSON; tratar 413/HTML das camadas acima
        const ct = r.headers.get('content-type') || '';
        if(!ct.includes('application/json')){
          if(r.status === 413){
            // Fallback: tentar upload direto para o Supabase via URL assinada (evita 413 da plataforma)
            try {
              const pres = await adminFetch('/api/admin/puppies/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-file-size': String(f.size) },
                body: JSON.stringify({ filename: f.name, mime: f.type, upsert: false }),
              });
              const presJson = await pres.json().catch(()=>null);
              if (!pres.ok) {
                const lim = isVid ? MAX_VIDEO_BYTES : (f.type === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES);
                const mb = (lim/1_000_000).toFixed(0);
                throw new Error(presJson?.error || `Arquivo muito grande. Limite: ${mb}MB para ${isVid? 'vídeo':'imagem'}.`);
              }
              const { path, token } = presJson as { path: string; token: string };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const supa = supabasePublic() as any; // tipagem frouxa apenas neste ponto para evitar dependência de tipos
              const { error: upErr } = await supa.storage.from('puppies').uploadToSignedUrl(path, token, f, { contentType: f.type, upsert: false });
              if (upErr) throw new Error(upErr.message || 'Falha no upload direto');
              const { data: pub } = supa.storage.from('puppies').getPublicUrl(path);
              setProgress(p=>({...p,[f.name]:100}));
              newUrls.push(pub.publicUrl);
              continue; // próximo arquivo
            } catch (fallbackErr: unknown) {
              const lim = isVid ? MAX_VIDEO_BYTES : (f.type === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES);
              const mb = (lim/1_000_000).toFixed(0);
              const baseMsg = `Arquivo muito grande para envio. Limite: ${mb}MB para ${isVid? 'vídeo':'imagem'}.`;
              const extra = fallbackErr instanceof Error ? ` Detalhe: ${fallbackErr.message}` : '';
              throw new Error(baseMsg + extra);
            }
          }
          throw new Error(`Erro de upload (${r.status})`);
        }

        const j = await r.json();
        if(!r.ok){
          const errorMsg = j?.error || `Upload falhou (${r.status})`;
          const details = j?.supported ? ` - Suportado: ${j.supported}` : '';
          throw new Error(errorMsg + details);
        }

        setProgress(p=>({...p,[f.name]:100}));
        newUrls.push(j.url);
      } catch(err: unknown){ 
        const msg = err instanceof Error ? err.message : 'Erro upload';
        push({ type:'error', message: msg }); 
      }
    }
    if(newUrls.length){
      let next = [...media, ...newUrls];
      const coverUrl = cover || newUrls[0];
      if(!cover && coverUrl && onSelectCover){ onSelectCover(coverUrl); }
      if(coverUrl){ next = [coverUrl, ...next.filter(u=> u!==coverUrl)]; }
      onChange(next);
      liveRef.current && (liveRef.current.textContent = `${newUrls.length} imagem(ns) adicionada(s). Total: ${next.length}`);
    }
    e.target.value='';
  }

  function onDragStart(e:React.DragEvent<HTMLLIElement>, index:number){ e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed='move'; }
  function onDragOver(e:React.DragEvent<HTMLLIElement>){ e.preventDefault(); e.dataTransfer.dropEffect='move'; }
  function onDrop(e:React.DragEvent<HTMLLIElement>, index:number){
    e.preventDefault();
    const fromStr = e.dataTransfer.getData('text/plain');
    const from = parseInt(fromStr,10);
    if(isNaN(from) || from===index) return;
    const arr = [...media];
    const [moved] = arr.splice(from,1);
    arr.splice(index,0,moved);
    onChange(arr);
    liveRef.current && (liveRef.current.textContent = 'Imagem reposicionada. Nova ordem aplicada.');
  }

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="font-medium" id="media-gallery-label">{label}</label>
        <input 
          aria-labelledby="media-gallery-label" 
          type="file" 
          accept="image/*,video/mp4,video/webm,video/quicktime" 
          multiple 
          onChange={handleFile} 
          className="text-[11px]" 
        />
      </div>
      <div ref={liveRef} aria-live="polite" className="sr-only" />
      {Object.keys(progress).length>0 && (
        <div className="flex flex-col gap-1 text-[10px]" aria-label="Uploads em progresso">
          {Object.entries(progress).map(([k,v])=> (
            <div key={k} className="flex items-center gap-2">
              <span className="truncate max-w-[120px]" title={k}>{k}</span>
              <div className="flex-1 h-1 rounded bg-[var(--surface-2)] overflow-hidden"><div style={{width:`${v}%`}} className="h-full bg-[var(--accent)] transition-[width]" /></div>
            </div>
          ))}
        </div>
      )}
      {media.length>0 && <ul className="grid grid-cols-3 gap-2" aria-label="Galeria reordenável">
        {media.map((m,i)=> {
          const isCover = cover===m;
          return (
            <li key={m} draggable onDragStart={(e)=> onDragStart(e,i)} onDragOver={onDragOver} onDrop={(e)=> onDrop(e,i)} className={`relative group aspect-square overflow-hidden rounded-lg border ${isCover? 'border-[var(--accent)] ring-2 ring-[var(--accent)]':'border-[var(--border)]'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m} alt={isCover? 'Capa (arraste para reordenar)': 'Miniatura (arraste)'} className="h-full w-full object-cover select-none pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/50 to-black/0" />
              <button type="button" onClick={()=> onChange(media.filter((_,x)=> x!==i))} aria-label="Remover" className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-[11px] opacity-0 group-hover:opacity-100 transition">×</button>
              {onSelectCover && (
                <button type="button" onClick={()=> onSelectCover(m)} className={`absolute left-1 bottom-1 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${isCover? 'bg-[var(--accent)] text-[var(--accent-contrast)]':'bg-black/40 text-white'} opacity-0 group-hover:opacity-100 transition`}>{isCover? 'CAPA':'Definir capa'}</button>
              )}
            </li>
          );})}
      </ul>}
      {media.length===0 && <p className="text-[11px] text-[var(--text-muted)]">Nenhuma mídia enviada.</p>}
      <p className="text-[10px] text-[var(--text-muted)]">Arraste para reordenar. A primeira é usada como capa para a vitrine.</p>
      <p className="text-[10px] text-[var(--text-muted)]">Limites: imagens estáticas até {(MAX_IMAGE_BYTES/1_000_000).toFixed(0)}MB; GIFs até {(MAX_GIF_BYTES/1_000_000).toFixed(0)}MB; vídeos até {(MAX_VIDEO_BYTES/1_000_000).toFixed(0)}MB. Tipos: JPG, PNG, WEBP, AVIF, GIF, MP4, WEBM, MOV.</p>
    </div>
  );
}
