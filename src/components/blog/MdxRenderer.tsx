'use client';

import { useMDXComponent } from 'next-contentlayer/hooks';

import mdxComponents from '@/components/MDXContent';

export default function MdxRenderer({ code }: { code: string }) {
  const MDX = useMDXComponent(code);
  return <MDX components={mdxComponents as any} />;
}
