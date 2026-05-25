// src/components/home/RecentPostsSkeleton.tsx
export default function RecentPostsSkeleton() {
	return (
		<section
			className="mx-auto w-full max-w-6xl px-5 md:px-6 py-16 sm:py-20"
			aria-labelledby="home-blog-heading"
			role="region"
		>
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 id="home-blog-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
						Últimos Artigos
					</h2>
					<p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
						Carregando conteúdo...
					</p>
				</div>
				<div className="h-8 w-24 rounded-md border border-zinc-200 dark:border-zinc-700 animate-pulse" aria-hidden="true" />
			</div>
			<ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
				{Array.from({ length: 3 }).map((_, i) => (
					<li
						key={i}
						className="flex flex-col overflow-hidden rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
					>
						<div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
						<div className="flex flex-1 flex-col p-4 gap-3">
							<div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
							<div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
							<div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
							<div className="mt-2 flex items-center justify-between">
								<div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
								<div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
							</div>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
