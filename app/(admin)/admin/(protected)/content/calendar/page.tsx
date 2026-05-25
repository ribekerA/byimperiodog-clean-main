"use client";
import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';
import * as React from 'react';
import { ScheduleDrawer } from '@/components/admin/ScheduleDrawer';
import { adminPostJSON, adminFetch } from '@/lib/adminFetch';
import { useToast } from '@/components/ui/toast';

function buildMonth(y:number, m:number){
  const first=new Date(y,m,1); const start=new Date(first); start.setDate(1-first.getDay());
  const days: Date[]=[]; for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); days.push(d); }
  return days;
}

interface PostOption { id:string; title:string }

export default function EditorialCalendar(){
  const { push } = useToast();
  const now=new Date();
  const [ym,setYm]=React.useState([now.getFullYear(), now.getMonth()] as [number,number]);
  const days=buildMonth(ym[0], ym[1]);
  const [drag,setDrag]=React.useState<string|null>(null);
  // events: key = YYYY-MM-DD -> array de { id?, label }
  const [events,setEvents]=React.useState<Record<string,{ id?:string; label:string }[]>>({});
  const todayKey = new Date().toISOString().slice(0,10);
  const [drawerOpen,setDrawerOpen]=React.useState(false);
  const [pendingDrop,setPendingDrop]=React.useState<{title:string; date:string; existingId?:string}|null>(null);
  const [dragEvent,setDragEvent]=React.useState<{from:string; idx:number}|null>(null);
  const [posts,setPosts]=React.useState<PostOption[]>([]);
  const [selectedPost,setSelectedPost]=React.useState<string>('');
  const gridRef = React.useRef<HTMLDivElement|null>(null);
  const [focusIndex,setFocusIndex]=React.useState<number>(0); // 0..41

  async function loadMonth(y:number,m:number){
    const month = `${y}-${String(m+1).padStart(2,'0')}`;
    try {
      const r = await adminFetch(`/api/admin/blog/schedule/events?month=${month}`);
      if(!r.ok) return;
      const j = await r.json();
      const map:Record<string,{id?:string;label:string}[]> = {};
      for(const ev of j.items||[]){
        const dayKey = (ev.run_at||'').slice(0,10);
        if(!map[dayKey]) map[dayKey]=[];
        map[dayKey].push({ id:ev.id, label:`${ev.action} @ ${ev.run_at.slice(11,16)}` });
      }
      setEvents(map);
    } catch {}
  }
  React.useEffect(()=>{ const [y,m]=ym; loadMonth(y,m); },[ym]);
  React.useEffect(()=>{ // load minimal posts list (últimos publicados) para seleção
    (async()=>{
      try { const r= await adminFetch('/api/admin/blog?page=1&perPage=20'); if(!r.ok) return; const j= await r.json(); setPosts((j.items||[]).map((p:any)=> ({ id:p.id, title:p.title||p.slug||'Sem título'}))); } catch{}
    })();
  },[]);
  async function createSchedule(title:string, date:string, time:string){
    if(!selectedPost) return; // exige seleção
    try {
      const run_at = `${date}T${time}:00Z`;
      const res = await adminPostJSON('/api/admin/blog/schedule/events', { post_id:selectedPost, run_at, action:'publish' });
      if(res.ok){ push({ type:'success', message:'Evento agendado' }); } else { push({ type:'error', message:'Falha ao agendar' }); }
      // reload incremental do dia
      await loadMonth(ym[0], ym[1]);
    } catch {}
  }
  async function deleteSchedule(ev:{ id?:string; label:string }, dayKey:string, idx:number){
    setEvents(e=>{ const arr=[...(e[dayKey]||[])]; arr.splice(idx,1); return {...e, [dayKey]:arr}; });
    if(ev.id){ try { const r= await adminFetch(`/api/admin/blog/schedule/events?id=${ev.id}`, { method:'DELETE' }); push({ type: r.ok? 'success':'error', message: r.ok? 'Evento removido':'Erro ao remover' }); } catch{ push({ type:'error', message:'Erro ao remover' }); } }
  }
  function onDrop(day:Date){
    const key=day.toISOString().slice(0,10);
    if(dragEvent){
      // mover evento existente
      const from=dragEvent.from; const idx=dragEvent.idx;
      const title=(events[from]||[])[idx];
      setEvents(prev=>{
        const src=[...(prev[from]||[])]; const [moved]=src.splice(idx,1);
        const dst=[...(prev[key]||[])]; if(moved) dst.push(moved);
        return { ...prev, [from]:src, [key]:dst };
      });
      setDragEvent(null);
      push({ type:'info', message:'Evento movido (não persistido)' });
      return;
    }
    if(drag){
      setPendingDrop({ title: drag, date: key });
      setDrawerOpen(true);
    }
  }
  function openEdit(ev:{id?:string; label:string}, dayKey:string){
    // apenas permite editar horário (abre drawer com data fixa)
    setPendingDrop({ title: ev.label.split('@')[0].trim(), date: dayKey, existingId: ev.id });
    setDrawerOpen(true);
  }
  function onConfirmSchedule(iso:string){
    if(!pendingDrop) return;
    const key=pendingDrop.date;
  const time = iso.slice(11,16);
  // edição simples: remove anterior se houver id (não persistimos update real aqui, apenas novo schedule)
  if(pendingDrop.existingId){
    setEvents(e=> ({...e, [key]:(e[key]||[]).filter(ev=> ev.id!==pendingDrop.existingId)}));
  }
  setEvents(e=> ({...e, [key]:[...(e[key]||[]), { label:`${pendingDrop.title} @ ${time}` }]}));
  createSchedule(pendingDrop.title, key, time);
    setPendingDrop(null);
    setDrag(null);
  }

  return (
      <>
      <Header />
      <Main>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-semibold">Calendário Editorial</h1>
          <div className="flex flex-wrap gap-2 text-sm items-center">
            <button onClick={()=> setYm(([y,m])=> m? [y,m-1]:[y-1,11])} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-2)]">Mês anterior</button>
            <button onClick={()=> setYm(([y,m])=> m<11? [y,m+1]:[y+1,0])} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-2)]">Próximo mês</button>
            <select value={selectedPost} onChange={e=> setSelectedPost(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm focus:border-[var(--accent)] focus:outline-none" aria-label="Post para agendar">
              <option value="">Selecione um post…</option>
              {posts.map(p=> <option key={p.id} value={p.id}>{p.title.slice(0,60)}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto" ref={gridRef}>
          <div className="grid min-w-[880px] grid-cols-7 gap-2" role="grid" aria-label="Calendário mensal" onKeyDown={(e)=>{
            const cols=7; if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
            e.preventDefault();
            setFocusIndex(idx=>{
              let n=idx; if(e.key==='ArrowLeft') n=idx-1; if(e.key==='ArrowRight') n=idx+1; if(e.key==='ArrowUp') n=idx-cols; if(e.key==='ArrowDown') n=idx+cols; if(n<0) n=0; if(n>41) n=41; return n; });
            // scroll automático horizontal se necessário
            requestAnimationFrame(()=>{
              const cells = gridRef.current?.querySelectorAll('[role="gridcell"]');
              if(cells){ const el = cells[focusIndex] as HTMLElement | undefined; el?.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); }
            });
          }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=> <div key={d} className="px-2 py-1 text-[11px] text-[var(--text-muted)]">{d}</div>)}
            {days.map((d,idx)=>{ const key=d.toISOString().slice(0,10); const inMonth=d.getMonth()===ym[1]; const isToday= key===todayKey; const focused = focusIndex===idx; return (
              <div key={idx} role="gridcell" tabIndex={focused?0:-1} onFocus={()=> setFocusIndex(idx)} onKeyDown={(e)=>{ if((e.key==='Enter'||e.key===' ') && drag){ e.preventDefault(); onDrop(d);} }} onDragOver={e=> e.preventDefault()} onDrop={()=> onDrop(d)} className={`min-h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${inMonth? '':'opacity-60'} ${isToday? 'ring-1 ring-[var(--accent)]':''}`} aria-label={`Dia ${d.getDate()}${isToday?' (hoje)':''} com ${(events[key]||[]).length} eventos`}>
                <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>{d.getDate()}</span>{isToday && <span className="rounded bg-[var(--surface-2)] px-1">hoje</span>}
                </div>
                <div className="space-y-1">
                  {(events[key]||[]).map((ev,i)=> (
                    <div key={i} draggable onDragStart={()=> setDragEvent({from:key, idx:i})} className="group flex items-center justify-between gap-2 truncate rounded bg-[var(--surface-2)] px-2 py-1">
                      <button onClick={()=> openEdit(ev,key)} className="truncate text-left flex-1 focus:outline-none focus:underline" title="Editar horário">{ev.label}</button>
                      <button onClick={()=> deleteSchedule(ev,key,i)} aria-label="Excluir" className="opacity-0 group-hover:opacity-100 transition text-[11px] rounded px-1 hover:bg-[var(--surface)] focus:opacity-100">×</button>
                    </div>
                  ))}
                </div>
              </div>
            );})}
          </div>
        </div>
  <div className="mt-6">
          <div className="text-sm font-medium">Fila (arraste para o calendário)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {posts.slice(0,12).map(p=> <div key={p.id} draggable onDragStart={()=> setDrag(p.title)} onKeyDown={(e)=>{ if((e.key==='Enter'||e.key===' ') && !drag){ e.preventDefault(); setDrag(p.title);} }} tabIndex={0} role="button" aria-pressed={drag===p.title} className="cursor-grab rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]">{p.title.slice(0,20)}</div>)}
            {posts.length>=20 && <button onClick={async()=>{ try { const nextPage=Math.floor(posts.length/20)+1; const r= await adminFetch(`/api/admin/blog?page=${nextPage}&perPage=20`); if(r.ok){ const j= await r.json(); const more=(j.items||[]).map((p:any)=> ({ id:p.id, title:p.title||p.slug||'Sem título'})); setPosts(p=> [...p, ...more]); } } catch{} }} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[var(--surface-2)]">+ Carregar mais</button>}
          </div>
        </div>
        <ScheduleDrawer open={drawerOpen} onOpenChange={setDrawerOpen} onConfirm={onConfirmSchedule} defaultDate={pendingDrop?.date} defaultTime="09:00" />
  </Main>
  </>
  );
}
