"use client";
import { useEffect, useRef } from 'react';

interface ScrollAnalyticsProps {
  articleSelector?: string;
  postId: string;
  readingTimeMin?: number;
}

const THRES = [25,50,75,100];

export default function ScrollAnalytics({ articleSelector='article', postId, readingTimeMin }: ScrollAnalyticsProps){
  const sent = useRef<Set<number>>(new Set());
  const start = useRef<number>(Date.now());

  useEffect(()=>{
    const el = document.querySelector(articleSelector);
    if(!el) return;
    function emit(name:string, extra:Record<string,unknown>={}){
      fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:name, post_id: postId, ...extra })}).catch(()=>{});
    }
    function onScroll(){
  if(!el) return;
  const rect = el.getBoundingClientRect();
  const total = el.scrollHeight - window.innerHeight;
      const passed = Math.min(total, Math.max(0, -rect.top));
      const pct = total>0 ? (passed/total)*100 : 0;
      THRES.forEach(t=>{
        if(pct >= t && !sent.current.has(t)){
          sent.current.add(t);
          emit('post_read_'+t);
          if(t===100){
            const elapsedMin = (Date.now()-start.current)/60000;
            if(!readingTimeMin || elapsedMin >= Math.min(readingTimeMin*0.4, readingTimeMin-0.2)){
              emit('post_read_complete', { elapsed_min: elapsedMin });
            }
          }
        }
      });
    }
    emit('post_view');
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    return ()=> window.removeEventListener('scroll', onScroll);
  },[articleSelector, postId, readingTimeMin]);
  return null;
}
