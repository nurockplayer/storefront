import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Radio } from "lucide-react";
import { getTachiyaStreamerList, type TachiyaStreamerSummary } from "@/lib/tachiya-streamer-catalog";
import { CategoryHero } from "@/ui/components/plp";

export const metadata = {
	title: "Streamers · Saleor Storefront example",
	description: "Browse active streamer shops in the Tachiya marketplace.",
};

type PageProps = {
	params: Promise<{ channel: string }>;
};

export default async function Page(props: PageProps) {
	const params = await props.params;
	const result = await getTachiyaStreamerList(100);
	if (!result.ok) {
		notFound();
	}

	const breadcrumbs = [
		{ label: "Home", href: `/${params.channel}` },
		{ label: "Streamers", href: `/${params.channel}/streamers` },
	];

	return (
		<>
			<CategoryHero
				title="Streamers"
				description="Browse curated shops from active Tachiya streamers."
				breadcrumbs={breadcrumbs}
			/>
			<StreamerGrid channel={params.channel} streamers={result.streamers} />
		</>
	);
}

function StreamerGrid({ channel, streamers }: { channel: string; streamers: TachiyaStreamerSummary[] }) {
	return (
		<section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			{streamers.length > 0 ? (
				<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{streamers.map((streamer) => (
						<li key={streamer.slug}>
							<Link
								href={`/${channel}/streamers/${streamer.slug}`}
								className="group block rounded-lg border bg-background p-5 transition-colors hover:border-foreground"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<Radio className="h-4 w-4 text-muted-foreground" />
											<h2 className="truncate text-lg font-semibold">{streamer.displayName}</h2>
										</div>
										<p className="mt-1 text-sm text-muted-foreground">@{streamer.slug}</p>
									</div>
									<ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
								</div>
								{streamer.saleorCollectionId ? (
									<p className="mt-4 truncate text-xs text-muted-foreground">
										Saleor collection {streamer.saleorCollectionId}
									</p>
								) : null}
							</Link>
						</li>
					))}
				</ul>
			) : (
				<div className="py-16 text-center">
					<p className="text-lg text-muted-foreground">No active streamer shops are available yet.</p>
				</div>
			)}
		</section>
	);
}
