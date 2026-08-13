import Image from "next/image";
import Link from "next/link";
import React from "react";

import { getImageSize } from "@/lib/_generated-image-sizes";

export const mdxComponents = {
  // Links use Next.js Link for internal routes; external fall back to <a>
  a: function A({ href = "", children, ...props }: any) {
    const isInternal = href?.startsWith("/") || href?.startsWith(process.env.NEXT_PUBLIC_SITE_URL || "");
    if (isInternal) {
      const to = href.replace(process.env.NEXT_PUBLIC_SITE_URL || "", "");
      return (
  <Link href={to} {...props} className={`link-brand underline-always ${props.className || ""}`}>
          {children}
        </Link>
      );
    }
    return (
  <a href={href} {...props} className={`link-brand underline-always ${props.className || ""}`} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  img: function Img(props: any) {
    const { src = "", alt = "", width, height, ...rest } = props;
    const isLocal = typeof src === "string" && src.startsWith("/");
    // next/image can't handle data: or blob: URLs; fallback to <img> for those.
    if (typeof src === "string" && (src.startsWith("blob:") || src.startsWith("data:"))) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} {...rest} />;
    }
    if (!isLocal) {
      // external images: use next/image with unoptimized to avoid remote loader issues
      return <Image src={src} alt={alt} width={Number(width) || 800} height={Number(height) || 450} unoptimized className="h-auto w-full rounded-lg" {...rest} />;
    }

    // A sintaxe `![alt](/caminho)` do markdown nao tem onde declarar dimensao, e
    // o padrao anterior (800x450) mentia sobre quase toda foto do canil — as do
    // catalogo sao retrato. O navegador reservava uma faixa 16:9 e, ao carregar,
    // empurrava o texto para baixo: CLS causado justamente pela foto que deveria
    // melhorar a pagina. O manifesto tem a medida real de cada arquivo.
    const medida = getImageSize(src);
    const w = Number(width) || medida?.[0] || 800;
    const h = Number(height) || medida?.[1] || 450;
    const retrato = h > w;

    return (
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        // Foto em pe ocupando os ~700px da coluna viraria uma imagem de 1.200px
        // de altura, empurrando o resto do artigo para fora da tela. No celular
        // segue 100% da largura.
        className="mx-auto h-auto w-full rounded-lg"
        style={{ maxWidth: retrato ? 460 : Math.min(w, 760) }}
        sizes={retrato ? "(max-width: 640px) 100vw, 460px" : "(max-width: 768px) 100vw, 760px"}
        {...rest}
      />
    );
  },
  h2: (props: any) => <h2 {...props} className={`mt-8 text-2xl font-semibold text-zinc-900 ${props.className || ""}`} />,
  h3: (props: any) => <h3 {...props} className={`mt-6 text-xl font-semibold text-zinc-900 ${props.className || ""}`} />,
  p: (props: any) => <p {...props} className={`mt-4 text-zinc-800 leading-relaxed ${props.className || ""}`} />,
  ul: (props: any) => <ul {...props} className={`mt-4 list-disc pl-6 space-y-1 ${props.className || ""}`} />,
  ol: (props: any) => <ol {...props} className={`mt-4 list-decimal pl-6 space-y-1 ${props.className || ""}`} />,
  blockquote: (props: any) => (
    <blockquote {...props} className={`my-6 border-l-4 border-zinc-300 pl-4 italic text-zinc-700 ${props.className || ""}`} />
  ),
  // Uma tabela nao pode encolher abaixo do min-content das colunas. Em tela de
  // 320px a coluna do artigo tem 288px, e as tabelas de comparacao de racas e de
  // custos pediam 315 a 434px: o excedente empurrava o documento inteiro e o
  // site inteiro ganhava rolagem lateral (medido em 4 artigos, ate 450px de
  // largura). O <table> continua `display: table`, entao no desktop nada muda —
  // ele segue ocupando 100% da coluna, porque la o min-content cabe. Quem rola
  // e o wrapper. `tabIndex` porque area rolavel precisa ser alcancavel pelo
  // teclado (WCAG 2.1.1).
  /* eslint-disable jsx-a11y/no-noninteractive-tabindex --
     A regra so aceita `tabpanel` na lista de roles que podem receber foco, mas
     area rolavel com `role="region"` + rotulo e o padrao que a WAI recomenda
     para satisfazer o criterio 2.1.1: sem `tabIndex` quem navega por teclado
     nao consegue rolar a tabela. Falso positivo — o markup fica. */
  table: (props: any) => (
    <div
      className="my-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      tabIndex={0}
      role="region"
      aria-label="Tabela — role para os lados para ver todas as colunas"
    >
      <table {...props} className={`my-0 ${props.className || ""}`} />
    </div>
  ),
  /* eslint-enable jsx-a11y/no-noninteractive-tabindex */
  code: (props: any) => <code {...props} className={`rounded bg-zinc-100 px-1 py-0.5 text-[0.95em] ${props.className || ""}`} />,
  pre: (props: any) => <pre {...props} className={`mt-4 overflow-auto rounded-lg bg-zinc-950 p-4 text-zinc-100 ${props.className || ""}`} />,
};

export default mdxComponents;

