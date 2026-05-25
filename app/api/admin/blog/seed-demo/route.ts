export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const sb = supabaseAdmin();

    // Upsert demo posts
    const posts = [
      {
        slug: "como-cuidar-do-seu-spitz-alemao-anao",
        title: "Como cuidar do seu Spitz Alemão Anão",
        subtitle: "Dicas práticas para os primeiros meses",
        excerpt:
          "Guia rápido para alimentação, higiene, vacinas e rotina do seu Spitz Alemão Anão (Lulu da Pomerânia).",
        cover_url: "/spitz-hero-desktop.webp",
        content_mdx:
          "# Alimentação\n\n- Ração de qualidade para filhotes\n- 3 a 4 pequenas refeições\n- Água fresca sempre disponível\n\n## Higiene e escovação\n\nEscove 2–3x por semana e use produtos próprios para pets.\n\n## Rotina e enriquecimento\n\nPasseios curtos, brinquedos interativos e reforço positivo.\n",
        status: "published",
        published_at: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        seo_title: "Como cuidar do seu Spitz Alemão Anão | Dicas essenciais",
        seo_description:
          "Alimentação, higiene, vacinas e rotina para os primeiros meses do seu Spitz Alemão Anão.",
        og_image_url: "/spitz-hero-desktop.webp",
      },
      {
        slug: "spitz-alemao-anao-personalidade-e-convivio",
        title: "Spitz Alemão Anão: personalidade e convívio",
        subtitle: null,
        excerpt: "Temperamento, socialização e dicas para conviver bem com crianças, idosos e outros pets.",
        cover_url: "/spitz-hero-mobile.png",
        content_mdx:
          "# Personalidade\n\nSão dóceis, curiosos e comunicativos.\n\n## Convívio\n\nParticipam da rotina e se adaptam bem com socialização adequada.\n",
        status: "published",
        published_at: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        seo_title: "Spitz Anão: personalidade e convívio",
        seo_description: "Veja como é a personalidade do Spitz Alemão Anão e como conviver bem em família.",
        og_image_url: "/spitz-hero-mobile.png",
      },
    ];

    const { data: upserted, error: upsertErr } = await sb
      .from("blog_posts")
      .upsert(posts, { onConflict: "slug" })
      .select("id,slug");
    if (upsertErr) throw upsertErr;

    // Ensure approved comments exist for the first post
  const first = upserted?.find((p:{id:string;slug:string}) => p.slug === "como-cuidar-do-seu-spitz-alemao-anao");
    if (first?.id) {
      const { count } = await sb
        .from("blog_comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", first.id)
        .eq("approved", true);
      if ((count ?? 0) < 2) {
        await sb.from("blog_comments").insert([
          { post_id: first.id, author_name: "Ana", body: "Ajudou muito nos primeiros dias com meu filhote!", approved: true },
          { post_id: first.id, author_name: "Carlos", body: "Conteúdo claro e direto, parabéns!", approved: true },
        ]);
      }
    }

    return NextResponse.json({ ok: true, posts: upserted?.length ?? 0 });
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
