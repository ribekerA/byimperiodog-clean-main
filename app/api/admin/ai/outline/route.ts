import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createAiTask, updateAiTask } from '@/lib/aiTasks';

interface OutlineReq { topic:string; scope?:string; keyword?:string; }

export async function POST(req:Request){
  const auth = requireAdmin(req); if(auth) return auth;
  const body = await req.json().catch(()=>({})) as OutlineReq;
  const topic = (body.topic||'').trim();
  if(!topic) return NextResponse.json({ ok:false, error:'topic obrigatório' },{ status:400 });
  const taskId = await createAiTask({ type:'outline', topic, payload:{ scope: body.scope||'guia-completo', keyword: body.keyword||null } });
  try {
    await updateAiTask(taskId,{ status:'running', phase:'outline', progress:10, started_at: new Date().toISOString() });
    const outline = buildOutline(topic, body.scope||'guia-completo');
    await updateAiTask(taskId,{ status:'done', progress:100, result:{ outline }, finished_at: new Date().toISOString() });
    return NextResponse.json({ ok:true, outline, task_id: taskId });
  } catch(e:any){
    await updateAiTask(taskId,{ status:'error', progress:100, error_message:e?.message||'erro' });
    return NextResponse.json({ ok:false, error:e?.message||'erro', task_id: taskId },{ status:500 });
  }
}

function buildOutline(topic:string, scope:string){
  const core = [
    { id:'intro', heading:'Introdução', goal:`Contextualizar ${topic} e relevância para tutores.`},
    { id:'perfil', heading:'Perfil da Raça', goal:'Características físicas e temperamento filhote vs adulto.'},
    { id:'cuidados', heading:'Cuidados Essenciais', goal:'Ambiente, higiene, grooming inicial.'},
    { id:'nutricao', heading:'Nutrição', goal:'Filhote, transição, ajustes adulto.'},
    { id:'saude', heading:'Saúde Preventiva', goal:'Calendário básico e sinais de alerta.'},
    { id:'treino', heading:'Treinamento & Socialização', goal:'Socialização estruturada e comandos base.'},
    { id:'atividade', heading:'Atividade & Enriquecimento', goal:'Exercícios mentais e físicos.'},
    { id:'faq', heading:'FAQ', goal:'≥5 perguntas frequentes.'},
    { id:'cta', heading:'Recursos & CTA', goal:'Links internos pilar/cluster e chamada final.'}
  ];
  if(scope==='filhote') return core.filter(s=> s.id!=='perfil').concat({ id:'desenvolvimento', heading:'Desenvolvimento do Filhote', goal:'Marcos 0-12 meses.'});
  return core;
}
