"use client";

// Wizard Editorial IA — fluxo leve (Brief → Outline → Draft → SEO → Imagem → Revisão/Publ.)
// Usa endpoints já existentes: /api/admin/blog/ai/outline, /ai/generate-post, /seo-suggestions, /ai/image, /blog (CRUD)

import React, { useEffect, useMemo, useState } from "react";
import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { adminFetch } from "@/lib/adminFetch";
import Link from "next/link";
import Image from "next/image";

type Step = 0|1|2|3|4|5;

type Draft = {
  id?: string;
  slug?: string;
  title: string;
  excerpt?: string;
  content_mdx?: string;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
  status?: string;
};

function useQualityScore(d: Draft){
  return useMemo(()=>{
    let s=0;
    if(d.title) s+=20;
    if((d.content_mdx||'').length>400) s+=20;
    if(d.excerpt) s+=15;
    if(d.seo_title) s+=15;
    if(d.seo_description) s+=15;
    if(d.og_image_url) s+=15;
    return Math.min(100,s);
  },[d.title,d.content_mdx,d.excerpt,d.seo_title,d.seo_description,d.og_image_url]);
}

export default function WizardPage(){
  const [step,setStep]=useState<Step>(0);
  const [topic,setTopic]=useState("");
  const [outline,setOutline]=useState<{ heading:string; children?:{heading:string}[]; summary?:string }[]|null>(null);
  const [draft,setDraft]=useState<Draft>({ title:"", excerpt:"", content_mdx:"", seo_title:"", seo_description:"", og_image_url:"", status:"draft" });
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState<string|null>(null);

  const quality = useQualityScore(draft);

  async function doOutline(){
    try{ setLoading(true); setMsg(null);
      const r = await adminFetch('/api/admin/blog/ai/outline',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ topic })});
      const j = await r.json(); if(!r.ok||!j?.ok) throw new Error(j?.error||'Falha outline');
      setOutline(j.outline||[]); setStep(1);
    }catch(e:any){ setMsg(String(e?.message||e)); } finally{ setLoading(false);} }

  async function doDraft(){
    try{ setLoading(true); setMsg(null);
      const payload = { topic, scope:'guia-completo', status:'draft', generateImage:false };
      const r = await adminFetch('/api/admin/blog/ai/generate-post',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const j = await r.json(); if(!r.ok||!j?.ok) throw new Error(j?.error||'Falha geração');
      const p = j.post||{}; setDraft((d)=>({ ...d, title:p.title||d.title, excerpt:p.excerpt||d.excerpt, content_mdx:p.content_mdx||d.content_mdx }));
      setStep(2);
    }catch(e:any){ setMsg(String(e?.message||e)); } finally{ setLoading(false);} }

  async function doSeo(){
    try{ setLoading(true); setMsg(null);
      const r = await adminFetch('/api/admin/blog/seo-suggestions',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: draft.title, excerpt: draft.excerpt, content_mdx: draft.content_mdx })});
      const j = await r.json(); if(!r.ok||!j?.ok) throw new Error(j?.error||'Falha SEO');
      const s = j.suggestions||{}; setDraft(d=>({ ...d, seo_title: s.seo_title||d.seo_title, seo_description: s.seo_description||d.seo_description }));
      setStep(3);
    }catch(e:any){ setMsg(String(e?.message||e)); } finally{ setLoading(false);} }

  async function doImage(){
    try{ setLoading(true); setMsg(null);
      const prompt = `OG para post sobre ${topic} (Spitz Alemão), limpo, fotográfico, foco no cão`;
      const r = await adminFetch('/api/admin/blog/ai/image',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, alt: draft.title||topic })});
      const j = await r.json(); if(!r.ok||!j?.url) throw new Error(j?.error||'Falha imagem');
      setDraft(d=>({ ...d, og_image_url: j.url }));
      setStep(4);
    }catch(e:any){ setMsg(String(e?.message||e)); } finally{ setLoading(false);} }

  async function doPublish(){
    try{ setLoading(true); setMsg(null);
      const r = await adminFetch('/api/admin/blog',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...draft, status:'published' })});
      const j = await r.json(); if(!r.ok) throw new Error(j?.error||'Falha salvar');
      const id = j?.id; setDraft(d=>({ ...d, id, slug:j?.slug||d.slug }));
      setMsg('Publicado com sucesso.'); setStep(5);
    }catch(e:any){ setMsg(String(e?.message||e)); } finally{ setLoading(false);} }

  return (
    <>
      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <BlogSubnav />
        <header>
          <h1 className="text-2xl font-bold">Wizard Editorial (IA)</h1>
          <p className="text-sm text-zinc-600">Fluxo guiado: Brief → Outline → Rascunho → SEO → Imagem → Publicar</p>
        </header>

        <div className="rounded border bg-white p-4">
          <div className="mb-2 text-sm">Qualidade</div>
          <div className="h-2 w-full rounded bg-zinc-200 overflow-hidden" aria-label="Qualidade do post" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={quality}>
            <div className={quality>=80? 'bg-emerald-600 h-full' : quality>=50? 'bg-amber-500 h-full':'bg-zinc-400 h-full'} style={{ width:`${quality}%`}} />
          </div>
        </div>

        {msg && <div role="status" className="text-sm">{msg}</div>}

        {/* Step 0: Brief */}
        {step===0 && (
          <section className="space-y-3">
            <label className="block text-sm font-medium">Tópico do post</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="Ex.: Guia de cuidados do Spitz" />
            <div className="flex gap-2">
              <button onClick={doOutline} disabled={!topic||loading} className="rounded border px-3 py-2 disabled:opacity-50">Gerar Outline</button>
            </div>
          </section>
        )}

        {/* Step 1: Outline */}
        {step===1 && (
          <section className="space-y-3">
            <div className="font-semibold">Outline sugerido</div>
            <ul className="list-disc pl-5 text-sm">
              {(outline||[]).map((o,i)=> <li key={i}>{o.heading}{o.children && <ul className="list-[circle] pl-5">{o.children.map((c,j)=> <li key={j}>{c.heading}</li>)}</ul>}</li>)}
            </ul>
            <div className="flex gap-2">
              <button onClick={()=> setStep(0)} className="rounded border px-3 py-2">Voltar</button>
              <button onClick={doDraft} disabled={loading} className="rounded border px-3 py-2 bg-emerald-50 text-emerald-700">Gerar Rascunho</button>
            </div>
          </section>
        )}

        {/* Step 2: Draft */}
        {step===2 && (
          <section className="space-y-3">
            <label className="block text-sm font-medium">Título</label>
            <input value={draft.title} onChange={e=> setDraft(d=>({...d,title:e.target.value}))} className="w-full rounded border px-3 py-2" />
            <label className="block text-sm font-medium">Resumo</label>
            <textarea value={draft.excerpt} onChange={e=> setDraft(d=>({...d,excerpt:e.target.value}))} className="w-full rounded border px-3 py-2" rows={2} />
            <label className="block text-sm font-medium">Conteúdo (MDX)</label>
            <textarea value={draft.content_mdx} onChange={e=> setDraft(d=>({...d,content_mdx:e.target.value}))} className="w-full rounded border px-3 py-2 font-mono" rows={12} />
            <div className="flex gap-2">
              <button onClick={()=> setStep(1)} className="rounded border px-3 py-2">Voltar</button>
              <button onClick={doSeo} disabled={loading} className="rounded border px-3 py-2">Gerar SEO</button>
            </div>
          </section>
        )}

        {/* Step 3: SEO */}
        {step===3 && (
          <section className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">SEO Title</label>
                <input value={draft.seo_title} onChange={e=> setDraft(d=>({...d,seo_title:e.target.value}))} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">SEO Description</label>
                <input value={draft.seo_description} onChange={e=> setDraft(d=>({...d,seo_description:e.target.value}))} className="w-full rounded border px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=> setStep(2)} className="rounded border px-3 py-2">Voltar</button>
              <button onClick={doImage} disabled={loading} className="rounded border px-3 py-2">Gerar Imagem</button>
            </div>
          </section>
        )}

        {/* Step 4: Image */}
        {step===4 && (
          <section className="space-y-3">
            {draft.og_image_url? <Image src={draft.og_image_url} alt={draft.title||topic} width={600} height={315} className="max-h-40 w-auto rounded border object-cover" /> : <div className="h-40 w-full bg-zinc-100 rounded" />}
            <div className="flex gap-2">
              <button onClick={()=> setStep(3)} className="rounded border px-3 py-2">Voltar</button>
              <button onClick={doPublish} disabled={loading||!draft.title} className="rounded border px-3 py-2 bg-blue-600 text-white disabled:opacity-50">Publicar</button>
            </div>
          </section>
        )}

        {/* Step 5: Done */}
        {step===5 && (
          <section className="space-y-3">
            <div className="text-sm">Concluído! {draft.slug && <Link className="underline" href={`/blog/${draft.slug}`} target="_blank">Ver post</Link>}</div>
            <div className="flex gap-2">
              <Link className="rounded border px-3 py-2" href="/admin/blog">Voltar para lista</Link>
              {draft.id && <Link className="rounded border px-3 py-2" href={`/admin/blog/editor?id=${draft.id}`}>Abrir no Editor</Link>}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
