import Image from "next/image";
import Link from "next/link";
import React from "react";

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
    const { src = "", alt = "", width = 800, height = 450, ...rest } = props;
    const isLocal = typeof src === "string" && src.startsWith("/");
    // next/image can't handle data: or blob: URLs; fallback to <img> for those.
    if (typeof src === "string" && (src.startsWith("blob:") || src.startsWith("data:"))) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} {...rest} />;
    }
    if (!isLocal) {
      // external images: use next/image with unoptimized to avoid remote loader issues
      return <Image src={src} alt={alt} width={Number(width)} height={Number(height)} unoptimized className="h-auto w-full rounded-lg" {...rest} />;
    }
    return <Image src={src} alt={alt} width={Number(width)} height={Number(height)} className="h-auto w-full rounded-lg" {...rest} />;
  },
  h2: (props: any) => <h2 {...props} className={`mt-8 text-2xl font-semibold text-zinc-900 ${props.className || ""}`} />,
  h3: (props: any) => <h3 {...props} className={`mt-6 text-xl font-semibold text-zinc-900 ${props.className || ""}`} />,
  p: (props: any) => <p {...props} className={`mt-4 text-zinc-800 leading-relaxed ${props.className || ""}`} />,
  ul: (props: any) => <ul {...props} className={`mt-4 list-disc pl-6 space-y-1 ${props.className || ""}`} />,
  ol: (props: any) => <ol {...props} className={`mt-4 list-decimal pl-6 space-y-1 ${props.className || ""}`} />,
  blockquote: (props: any) => (
    <blockquote {...props} className={`my-6 border-l-4 border-zinc-300 pl-4 italic text-zinc-700 ${props.className || ""}`} />
  ),
  code: (props: any) => <code {...props} className={`rounded bg-zinc-100 px-1 py-0.5 text-[0.95em] ${props.className || ""}`} />,
  pre: (props: any) => <pre {...props} className={`mt-4 overflow-auto rounded-lg bg-zinc-950 p-4 text-zinc-100 ${props.className || ""}`} />,
};

export default mdxComponents;

