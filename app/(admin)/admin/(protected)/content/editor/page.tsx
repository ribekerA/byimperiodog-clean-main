"use client";
import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';
import * as React from 'react';
import { QualityBar } from '@/components/admin/QualityBar';
import { RelatedPicker } from '@/components/admin/RelatedPicker';
import { ScheduleDrawer } from '@/components/admin/ScheduleDrawer';

const STEPS = ['Brief','Outline','Draft MDX','SEO','Imagens','Review/Publish'] as const;
type Step = typeof STEPS[number];

export default function EditorialWizardPage(){
  const [stepIdx,setStepIdx]=React.useState(0);
  const step:Step = STEPS[stepIdx];
  const [title,setTitle]=React.useState('');
  const [outline,setOutline]=React.useState('');
  const [mdx,setMdx]=React.useState('');
  const [seo,setSeo]=React.useState({ metaTitle:'', metaDesc:'', slug:'' });
  const [images,setImages]=React.useState<string[]>([]);
  const [related,setRelated]=React.useState<string[]>([]);
  const [openSched,setOpenSched]=React.useState(false);

  const score = React.useMemo(()=>{
    let s=0; if(title.trim().length>10) s+=20; if(outline.trim().length>20) s+=20; if(mdx.trim().length>100) s+=20; if(seo.metaTitle && seo.metaDesc && seo.slug) s+=20; if(images.length) s+=10; if(related.length) s+=10; return s; },[title,outline,mdx,seo,images,related]);

  function next(){ setStepIdx(i=> Math.min(i+1, STEPS.length-1)); }
  function prev(){ setStepIdx(i=> Math.max(i-1, 0)); }

  return (
      <>
      <Header />
      <Main>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Wizard Editorial</h1>
            <p className="text-sm text-[var(--text-muted)]">{STEPS.map((s,i)=> <span key={s} className={i===stepIdx? 'font-medium':'opacity-60'}>{i? ' · ':''}{s}</span>)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=> setOpenSched(true)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Agendar</button>
            <button className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-contrast)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Publicar</button>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {step==='Brief' && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="block text-sm font-medium">Título/H1</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
                <label className="mt-3 block text-sm font-medium">Brief</label>
                <textarea className="mt-1 h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" placeholder="Objetivo, persona, tópicos-chave" />
              </section>
            )}
            {step==='Outline' && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="block text-sm font-medium">Seções</label>
                <textarea value={outline} onChange={e=>setOutline(e.target.value)} className="mt-1 h-56 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" placeholder="H2/H3 e bullets" />
              </section>
            )}
            {step==='Draft MDX' && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="block text-sm font-medium">Conteúdo MDX</label>
                <textarea value={mdx} onChange={e=>setMdx(e.target.value)} className="mt-1 h-72 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" placeholder={"## Introdução\n..."} />
              </section>
            )}
            {step==='SEO' && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium">Meta Title</label>
                  <input value={seo.metaTitle} onChange={e=>setSeo(v=> ({...v, metaTitle:e.target.value}))} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Meta Description</label>
                  <input value={seo.metaDesc} onChange={e=>setSeo(v=> ({...v, metaDesc:e.target.value}))} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Slug</label>
                  <input value={seo.slug} onChange={e=>setSeo(v=> ({...v, slug:e.target.value}))} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
                </div>
              </section>
            )}
            {step==='Imagens' && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-sm font-medium">Capa e variações</div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button onClick={()=> setImages((arr)=> [...arr, 'novo'])} className="h-24 w-36 rounded-xl border border-dashed border-[var(--border)] text-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]">+ Gerar mock</button>
                  {images.map((_,i)=> <div key={i} className="h-24 w-36 rounded-xl bg-[var(--surface-2)]" />)}
                </div>
              </section>
            )}
            {step==='Review/Publish' && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                <div className="text-sm font-medium">Revisão</div>
                <ul className="list-disc pl-5 text-sm text-[var(--text)]">
                  <li>Title: {title? 'Ok':'Faltando'}</li>
                  <li>Outline: {outline? 'Ok':'Faltando'}</li>
                  <li>MDX: {mdx? 'Ok':'Faltando'}</li>
                  <li>SEO: {seo.metaTitle && seo.metaDesc && seo.slug? 'Ok':'Incompleto'}</li>
                  <li>Imagens: {images.length? 'Ok':'Faltando'}</li>
                </ul>
              </section>
            )}
            <div className="flex items-center justify-between">
              <button onClick={prev} disabled={stepIdx===0} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm disabled:opacity-50 hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Voltar</button>
              <button onClick={next} disabled={stepIdx===STEPS.length-1} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-50 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Avançar</button>
            </div>
          </div>
          <aside className="space-y-4">
            <QualityBar score={score} />
            <RelatedPicker value={related} onChange={setRelated} />
          </aside>
        </div>
        <ScheduleDrawer open={openSched} onOpenChange={setOpenSched} onConfirm={(iso)=> console.log('scheduled', iso)} />
  </Main>
  </>
  );
}
