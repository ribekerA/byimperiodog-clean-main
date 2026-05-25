import { ImageResponse } from 'next/og';
export const runtime = 'edge';

export async function GET(req: Request){
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'By Imperio Dog';
    const subtitle = searchParams.get('subtitle') || 'Spitz Alemão & Conteúdo Especializado';
    const category = searchParams.get('category') || '';
    return new ImageResponse(
      (
        <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%',background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'#fff',padding:'64px',fontFamily:'sans-serif',justifyContent:'space-between'}}>
          <div style={{fontSize:32,opacity:0.7}}>By Imperio Dog {category? `• ${category}`: ''}</div>
          <div style={{fontSize:72,lineHeight:1.05,fontWeight:700, maxHeight:'70%', overflow:'hidden'}}>{title}</div>
          <div style={{fontSize:28,opacity:0.8}}>{subtitle}</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch(e:any){
    return new Response('OG error '+(e?.message||e), { status:500 });
  }
}
