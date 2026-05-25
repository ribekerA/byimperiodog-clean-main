import React from 'react';

export function Sparkline({ points, width=120, height=30, color='#059669' }: { points:number[]; width?:number; height?:number; color?:string }){
  if(!points.length) return <div className="text-[10px] text-zinc-400">—</div>;
  const step = points.length>1? width/(points.length-1): width;
  const d = points.map((p,i)=> `${i===0?'M':'L'}${(i*step).toFixed(1)},${(height - (p/100)*height).toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
