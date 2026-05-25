import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { getAllPosts } from '@/lib/content';
import { supabasePublic } from '@/lib/supabasePublic';

import RecentPostsSkeleton from './RecentPostsSkeleton';

// Deferir animações não-críticas para reduzir JS inicial
const RecentPostsListAnimated = dynamic(() => import('./RecentPostsListAnimated'), {
	ssr: false,
	loading: () => null,
});

export async function RecentPostsSection() {
	const supa = supabasePublic();
	const { data: recentPostsRaw, error } = await supa
		.from('blog_posts')
		.select('id,slug,title,cover_url,excerpt,published_at,reading_time')
		.eq('status','published')
		.order('published_at', { ascending:false })
		.limit(3);

	if (error) {
		console.error('Erro posts home:', error.message);
	}
	let recentPosts = recentPostsRaw ?? [];

	// Fallback para Contentlayer quando não houver posts publicados no Supabase
	if (!recentPosts || recentPosts.length === 0) {
		const { items } = await getAllPosts({ page: 1, pageSize: 3 });
		recentPosts = items.map((p) => ({
			id: p.slug,
			slug: p.slug,
			title: p.title,
			cover_url: p.cover || null,
			excerpt: p.excerpt || null,
			published_at: p.date || null,
			reading_time: p.readingTime || null,
		}));
	}

	return (
		<section
			className="mx-auto w-full max-w-6xl px-5 md:px-6 py-16 sm:py-20"
			aria-labelledby="home-blog-heading"
		>
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 id="home-blog-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Últimos Artigos</h2>
					<p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
						Conheça dicas, guias e novidades sobre o Spitz Alemão para uma jornada de tutoria responsável.
					</p>
				</div>
				<Link
					href="/blog"
					className={cn(buttonVariants({ variant:'outline', size:'sm' }), 'self-start sm:self-auto')}
					aria-label="Ver todos os artigos do blog"
				>
					Ver todos
				</Link>
			</div>
			{recentPosts.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
						<p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum artigo publicado ainda.</p>
				</div>
			) : (
				<>
					<RecentPostsListAnimated posts={recentPosts as Array<{ id: string | number; slug: string; title: string; cover_url?: string | null; excerpt?: string | null; published_at?: string | null; reading_time?: number | null; }>} />
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify({
								'@context': 'https://schema.org',
								'@type': 'ItemList',
								itemListElement: recentPosts.map((p: { slug: string; title: string }, i:number) => ({
									'@type': 'ListItem',
									position: i + 1,
									url: `https://imperio.dog/blog/${p.slug}`,
									name: p.title
								}))
							})
						}}
					/>
				</>
			)}
		</section>
	);
}

export function RecentPostsSectionSuspense() {
	return (
		<Suspense fallback={<RecentPostsSkeleton />}> 
			<RecentPostsSection />
		</Suspense>
	);
}
