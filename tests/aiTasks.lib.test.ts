import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createAiTask, updateAiTask } from '../src/lib/aiTasks';

// Estruturas em memória para mock
interface TaskPayload { [k:string]: unknown }
interface TaskRec { id:string; type:string; topic:string|null; post_id:string|null; payload:TaskPayload|null; phase?:string|null; status?:string; progress?:number; result?:unknown; error_message?:string|null }
const tasks: TaskRec[] = [];
let failInsert = false;
let failUpdate = false;

function reset(){ tasks.length = 0; failInsert = false; failUpdate = false; }

// Mock supabaseAdmin
vi.mock('../src/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (table:string) => {
      if(table !== 'ai_tasks') return { insert: () => ({ select: () => ({ single: async () => ({ data:null, error: new Error('wrong table') }) }) }) };
      return {
  insert: (vals:Partial<TaskRec>[]) => ({
          select: () => ({
            single: async () => {
              if(failInsert) return { data:null, error: new Error('insert failed') };
              const v = vals[0];
              const rec:TaskRec = { id:`t${tasks.length+1}`, type:String(v.type||'unknown'), topic:(v.topic as string)||null, post_id:(v.post_id as string)||null, payload:(v.payload as TaskPayload)||null, status:'pending', progress:0 };
              tasks.push(rec);
              return { data:{ id: rec.id }, error:null };
            }
          })
        }),
  update: (patch:Partial<TaskRec>) => ({
          eq: (_col:string, id:string) => {
            if(failUpdate) return { error: new Error('update failed') };
            const idx = tasks.findIndex(t=> t.id===id);
            if(idx>=0) tasks[idx] = { ...tasks[idx], ...patch };
            return { error:null };
          }
        })
      };
    }
  })
}));

describe('aiTasks lib', () => {
  beforeEach(()=> reset());

  it('createAiTask retorna id e persiste task mínima', async () => {
    const id = await createAiTask({ type:'outline', topic:'Tema A', payload:{ foo:1 } });
    expect(id).toBeDefined();
    expect(tasks.find(t=> t.id===id)?.type).toBe('outline');
  });

  it('updateAiTask aplica patch de progresso e status', async () => {
    const id = await createAiTask({ type:'draft' });
    await updateAiTask(id, { status:'running', progress:40 });
    const rec = tasks.find(t=> t.id===id)!;
    expect(rec.status).toBe('running');
    expect(rec.progress).toBe(40);
  });

  it('createAiTask propaga erro de insert', async () => {
    failInsert = true;
    await expect(createAiTask({ type:'refine' })).rejects.toThrow(/insert failed/);
  });

  it('updateAiTask propaga erro de update', async () => {
    const id = await createAiTask({ type:'refine' });
    failUpdate = true;
    await expect(updateAiTask(id, { status:'done' })).rejects.toThrow(/update failed/);
  });
});
