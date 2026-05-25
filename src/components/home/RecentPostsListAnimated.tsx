// src/components/home/RecentPostsListAnimated.tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { BLUR_DATA_URL } from '@/lib/placeholders';

export interface RecentPostItem {
	id: string | number;
	slug: string;
	title: string;
	cover_url?: string | null;
	excerpt?: string | null;
	published_at?: string | null;
	reading_time?: number | null;
}

export default function RecentPostsListAnimated({ posts }: { posts: RecentPostItem[] }) {
	const prefersReduced = useReducedMotion();
	const baseHidden = { opacity: 0, y: prefersReduced ? 0 : 12 };
	return (
		<ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{posts.map((p, idx) => {
				const dateIso = p.published_at ? new Date(p.published_at).toISOString() : undefined;
				const dateFormatted = p.published_at ? new Date(p.published_at).toLocaleDateString('pt-BR') : '—';
				const readingTime = p.reading_time || 5;
				return (
					<motion.li
						key={p.id}
						initial={baseHidden}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 0.84, 0.44, 1] as [number, number, number, number] }}
						className="group relative flex flex-col overflow-hidden rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-shadow hover:shadow-md focus-within:ring-emerald-500/50"
					>
						<Link href={`/blog/${p.slug}`} className="focus:outline-none" aria-label={`Ler artigo: ${p.title}`}>
						<div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
							{p.cover_url ? (
								<Image
									src={p.cover_url}
									alt={p.title}
										width={800}
										height={450}
										loading={idx===0 ? 'eager':'lazy'}
										priority={idx===0}
										fetchPriority={idx===0 ? 'high':'auto'}
										decoding={idx===0 ? 'sync':'async'}
										sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
									className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									placeholder="blur"
									blurDataURL={BLUR_DATA_URL}
									draggable={false}
								/>
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
									Sem capa
								</div>
							)}
							<span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" aria-hidden="true" />
						</div>
							<div className="flex flex-1 flex-col p-4">
								<h3 className="line-clamp-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 transition-colors">
									{p.title}
								</h3>
								{p.excerpt && (
									<p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
										{p.excerpt}
									</p>
								)}
								<div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
									<time dateTime={dateIso}>{dateFormatted}</time>
									<span aria-label={`Tempo de leitura estimado ${readingTime} minutos`}>{readingTime} min</span>
								</div>
							</div>
						</Link>
					</motion.li>
				);
			})}
		</ul>
	);
}
