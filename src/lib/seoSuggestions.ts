import { supabaseAdmin } from './supabaseAdmin';

export interface SeoSuggestion { id:string; entity_type:string; entity_id:string|null; entity_ref:string|null; data_json:Record<string, unknown>|null; score:number|null; status:string; }

export async function listSuggestions(status='proposed', limit=50){
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('seo_suggestions').select('id,entity_type,entity_id,entity_ref,data_json,score,status,created_at').eq('status', status).order('created_at',{ ascending:false }).limit(limit);
  if(error) throw error; return data||[];
}

export async function approveSuggestion(id:string){
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('seo_suggestions').update({ status:'approved', approved_at: new Date().toISOString() }).eq('id', id).select('id').maybeSingle();
  if(error) throw error; return data;
}

export async function applySuggestion(id:string){
  const sb = supabaseAdmin();
  const { data: sug, error } = await sb.from('seo_suggestions').select('id,entity_type,entity_id,data_json,status').eq('id', id).maybeSingle();
  if(error) throw error; if(!sug) throw new Error('not-found');
  if(sug.status !== 'approved' && sug.status !== 'proposed') throw new Error('invalid-status');
  if(sug.entity_type === 'blog_post' && sug.entity_id){
    const patch: Record<string, unknown> = {};
    const d = (sug as { data_json: Record<string, unknown>|null }).data_json || {};
    for(const k of ['seo_title','seo_description','og_image_url','canonical_url']){
      if(d[k]) patch[k] = d[k];
    }
    if(Object.keys(patch).length){
      await sb.from('blog_posts').update(patch).eq('id', sug.entity_id);
    }
  }
  await sb.from('seo_suggestions').update({ status:'applied', approved_at: new Date().toISOString(), approved_by: null, approved_at_ext: new Date().toISOString() }).eq('id', id);
  return { applied:true };
}
