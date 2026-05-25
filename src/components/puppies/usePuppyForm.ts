"use client";
import { useMemo, useRef, useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { adminFetch } from '@/lib/adminFetch';
import { formatCentsToBRL, parseBRLToCents } from '@/lib/price';
import { PuppyDTO, RawPuppy, normalizePuppy } from '@/types/puppy';

type AnyPuppyInput = RawPuppy | (RawPuppy & { nome?: string|null; name?: string|null });

export interface UsePuppyFormOptions {
  mode: 'create' | 'edit';
  record?: AnyPuppyInput; // required para edit; aceita shape proveniente do backend
  onSuccess?: (data: any) => void;
}

export function usePuppyForm({ mode, record, onSuccess }: UsePuppyFormOptions){
  const isEdit = mode === 'edit';
  const { push } = useToast();
  const normalized: PuppyDTO | null = record ? normalizePuppy(record) : null;

  const [values, setValues] = useState(()=> {
    if(normalized){
      return {
        codigo: normalized.codigo || '',
        nome: normalized.nome,
        gender: normalized.gender,
        status: normalized.status,
        color: normalized.color,
  price_display: normalized.price_cents ? formatCentsToBRL(normalized.price_cents) : '',
        nascimento: normalized.nascimento || '',
        image_url: normalized.image_url || '',
        descricao: normalized.descricao || '',
        notes: normalized.notes || '',
        video_url: normalized.video_url || '',
        midia: normalized.midia,
      };
    }
    return { codigo:'', nome:'', gender:'female' as 'female'|'male', status:'disponivel' as 'disponivel'|'reservado'|'vendido', color:'', price_display:'', nascimento:'', image_url:'', descricao:'', notes:'', video_url:'', midia:[] as string[] };
  });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement|null>(null);
  const firstErrorRef = useRef<HTMLInputElement|null>(null);

  const priceCents = useMemo(()=> parseBRLToCents(values.price_display), [values.price_display]);

  function set<K extends keyof typeof values>(k:K, v:any){ setValues(s=> ({ ...s, [k]: v })); }
  function setMedia(list:string[]){
    setValues(s=>{ let next = list; const cover = s.image_url || list[0]; if(cover){ next = [cover, ...list.filter(u=> u!==cover)]; } return { ...s, midia: next }; });
  }
  function setCover(url:string){
    setValues(s=> ({ ...s, image_url: url, midia: [url, ...s.midia.filter((m:string)=> m!==url)] }));
  }

  function validate(){
    const e:Record<string,string> = {};
    if(!values.nome.trim()) e.nome = 'Obrigatório';
    if(priceCents <= 0) e.price_display = '> 0';
    if(!values.color.trim()) e.color = 'Obrigatório';
    if(values.image_url && !/^https?:\/\//.test(values.image_url)) e.image_url = 'URL inválida';
    if(values.video_url && values.video_url.trim() && !/^https?:\/\//.test(values.video_url)) e.video_url = 'URL inválida';
    if(values.nascimento && !/^\d{4}-\d{2}-\d{2}$/.test(values.nascimento)) e.nascimento = 'AAAA-MM-DD';
    setErrors(e);
    return e;
  }

  async function submit(){
    const e = validate();
    if(Object.keys(e).length){
      setShowSummary(true);
      requestAnimationFrame(()=>{
        if(summaryRef.current){ summaryRef.current.scrollIntoView({ behavior:'smooth', block:'start' }); }
        if(e.nome && firstErrorRef.current){ firstErrorRef.current.focus(); }
      });
      push({ type:'error', message:'Corrija os campos.' });
      return;
    }
    try {
      setSubmitting(true);
      const payload:any = {
        codigo: values.codigo || undefined,
        nome: values.nome.trim(),
        gender: values.gender,
        status: values.status,
        color: values.color.trim(),
        price_cents: priceCents,
        nascimento: values.nascimento || null,
        image_url: values.image_url || null,
        descricao: values.descricao || null,
        notes: values.notes || null,
        video_url: values.video_url || null,
        midia: values.midia,
      };
      let url = '/api/admin/puppies';
      let method: 'POST'|'PUT' = 'POST';
      if(isEdit){ method='PUT'; payload.id = record?.id; }
      const r = await adminFetch(url,{ method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const j = await r.json().catch(()=>null);
      if(!r.ok) {
        let msg = j?.error || 'Erro';
        if(j?.supabaseError?.message) msg += `: ${j.supabaseError.message}`;
        if(j?.exception) msg += ` (Exception: ${j.exception})`;
        if(j?.sentData) msg += ` [sentData: ${JSON.stringify(j.sentData)}]`;
        push({ type:'error', message: msg });
        throw new Error(msg);
      }
      push({ type:'success', message: isEdit? 'Filhote atualizado.' : `Filhote cadastrado${values.codigo? ' (#'+values.codigo+')':''}.` });
      onSuccess && onSuccess(j);
      if(!isEdit){
        setValues({ codigo:'', nome:'', gender:'female', status:'disponivel', color:'', price_display:'', nascimento:'', image_url:'', descricao:'', notes:'', video_url:'', midia:[] });
        setErrors({});
        setShowSummary(false);
      }
    } catch(err:any){
      push({ type:'error', message: err?.message || 'Erro ao salvar' });
    }
    finally { setSubmitting(false); }
  }

  return {
    isEdit,
    values, set, setMedia, setCover,
    errors, submitting, submit, priceCents,
    showSummary, setShowSummary,
    firstErrorRef, summaryRef,
  };
}
