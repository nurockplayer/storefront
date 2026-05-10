import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import {
	ProductListByCollectionDocument,
	ProductOrderField,
	OrderDirection,
	HomepageBannerDocument,
} from "@/gql/graphql";
import { executePublicGraphQL } from "@/lib/graphql";
import { selectHomepageStreamers } from "@/lib/tachiya-homepage-streamers";
import { homepageMetadata } from "@/lib/tachiya-site-metadata";
import { getTachiyaStreamerList, type TachiyaStreamerSummary } from "@/lib/tachiya-streamer-catalog";
import { ProductList } from "@/ui/components/product-list";
import { Banner } from "@/ui/components/banner";

export const metadata = homepageMetadata;

async function getFeaturedProducts(channel: string) {
	const result = await executePublicGraphQL(ProductListByCollectionDocument, {
		variables: {
			slug: "featured-products",
			channel,
			first: 12,
			sortBy: { field: ProductOrderField.Collection, direction: OrderDirection.Asc },
		},
		revalidate: 300,
	});

	if (!result.ok) {
		console.warn(`[Homepage] Failed to fetch featured products for ${channel}:`, result.error.message);
		return [];
	}

	return result.data.collection?.products?.edges.map(({ node }) => node) ?? [];
}

async function getHomepageBanner() {
	const result = await executePublicGraphQL(HomepageBannerDocument, {
		variables: { slug: "homepage-banner" },
		revalidate: 300,
	});

	return result.ok ? result.data.page : null;
}

async function getHomepageStreamers() {
	const result = await getTachiyaStreamerList(4);
	if (!result.ok) {
		if (result.reason !== "missing-config") {
			console.warn(`[Homepage] Failed to fetch streamer shops: ${result.reason}`);
		}
		return [];
	}

	return selectHomepageStreamers(result.streamers);
}

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const bannerPage = await getHomepageBanner();

	return (
		<>
			{bannerPage && <Banner page={bannerPage} />}
			<Suspense fallback={null}>
				<HomepageStreamerShops params={props.params} />
			</Suspense>
			<section className="mx-auto max-w-7xl p-8 pb-16">
				<h2 className="sr-only">Product list</h2>
				<Suspense
					fallback={
						<ul
							role="list"
							data-testid="ProductList"
							className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
						>
							{Array.from({ length: 12 }).map((_, i) => (
								<li key={i} className="animate-pulse">
									<div className="aspect-square overflow-hidden bg-secondary" />
									<div className="mt-2 flex justify-between">
										<div>
											<div className="mt-1 h-4 w-32 rounded bg-secondary" />
											<div className="mt-1 h-4 w-20 rounded bg-secondary" />
										</div>
										<div className="mt-1 h-4 w-16 rounded bg-secondary" />
									</div>
								</li>
							))}
						</ul>
					}
				>
					<FeaturedProducts params={props.params} />
				</Suspense>
			</section>
		</>
	);
}

async function FeaturedProducts({ params: paramsPromise }: { params: Promise<{ channel: string }> }) {
	const { channel } = await paramsPromise;
	const products = await getFeaturedProducts(channel);

	return <ProductList products={products} />;
}

async function HomepageStreamerShops({ params: paramsPromise }: { params: Promise<{ channel: string }> }) {
	const [{ channel }, streamers] = await Promise.all([paramsPromise, getHomepageStreamers()]);
	if (streamers.length === 0) {
		return null;
	}

	return (
		<section className="bg-secondary/30 border-y border-border">
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-medium text-muted-foreground">Tachiya streamers</p>
						<h2 className="mt-1 text-2xl font-semibold text-foreground">Shop by streamer</h2>
					</div>
					<Link
						href={`/${channel}/streamers`}
						prefetch={false}
						className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
					>
						View all
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
				<ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{streamers.map((streamer) => (
						<HomepageStreamerCard key={streamer.slug} channel={channel} streamer={streamer} />
					))}
				</ul>
			</div>
		</section>
	);
}

function HomepageStreamerCard({ channel, streamer }: { channel: string; streamer: TachiyaStreamerSummary }) {
	return (
		<li>
			<Link
				href={`/${channel}/streamers/${streamer.slug}`}
				prefetch={false}
				className="group flex h-full flex-col justify-between rounded-md border border-border bg-background p-4 transition-colors hover:border-foreground"
			>
				<div className="flex items-start gap-3">
					<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
						<Radio className="h-4 w-4" />
					</span>
					<div className="min-w-0">
						<h3 className="truncate text-base font-semibold text-foreground">{streamer.displayName}</h3>
						<p className="mt-1 truncate text-sm text-muted-foreground">@{streamer.slug}</p>
					</div>
				</div>
				<span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
					Open shop
					<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</span>
			</Link>
		</li>
	);
}
