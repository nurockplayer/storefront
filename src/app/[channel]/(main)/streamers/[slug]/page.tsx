import { Suspense } from "react";
import { notFound } from "next/navigation";
import { type Metadata, type ResolvingMetadata } from "next";
import { ProductListPaginatedDocument } from "@/gql/graphql";
import { buildStreamerCatalogDescription } from "@/lib/tachiya-streamer-display";
import { getTachiyaStreamerCatalog, type TachiyaStreamerCatalog } from "@/lib/tachiya-streamer-catalog";
import { executePublicGraphQL } from "@/lib/graphql";
import { getPaginatedListVariables } from "@/lib/utils";
import { CategoryHero, transformToProductCard } from "@/ui/components/plp";
import { buildFilterVariables, buildSortVariables } from "@/ui/components/plp/filter-utils";
import { StreamerCatalogClient } from "./client";

type PageProps = {
	params: Promise<{ channel: string; slug: string }>;
	searchParams: Promise<{
		cursor?: string | string[];
		direction?: string | string[];
		sort?: string;
		price?: string;
		colors?: string;
		sizes?: string;
	}>;
};

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata): Promise<Metadata> => {
	const params = await props.params;
	const catalog = await getCatalogOrNull(params.slug);
	const parentTitle = (await parent).title?.absolute;

	return {
		title: `${catalog?.streamer.displayName || "Streamer"} | ${parentTitle}`,
		description: catalog
			? `Shop ${catalog.streamer.displayName}'s selected products.`
			: "Shop streamer-selected products.",
	};
};

export default async function Page(props: PageProps) {
	const params = await props.params;
	const catalog = await getCatalogOrNull(params.slug);
	if (!catalog) {
		notFound();
	}

	const breadcrumbs = [
		{ label: "Home", href: `/${params.channel}` },
		{ label: catalog.streamer.displayName, href: `/${params.channel}/streamers/${params.slug}` },
	];
	const description = buildStreamerCatalogDescription(catalog.streamer);

	return (
		<>
			<CategoryHero
				title={catalog.streamer.displayName}
				description={description}
				breadcrumbs={breadcrumbs}
			/>
			<Suspense fallback={<ProductsGridSkeleton />}>
				<StreamerProducts params={props.params} searchParams={props.searchParams} catalog={catalog} />
			</Suspense>
		</>
	);
}

async function StreamerProducts({
	params: paramsPromise,
	searchParams: searchParamsPromise,
	catalog,
}: {
	params: PageProps["params"];
	searchParams: PageProps["searchParams"];
	catalog: TachiyaStreamerCatalog;
}) {
	const [params, searchParams] = await Promise.all([paramsPromise, searchParamsPromise]);
	const paginationVariables = getPaginatedListVariables({ params: searchParams });
	const sortBy = buildSortVariables(searchParams.sort);
	const filter = {
		...buildFilterVariables({ priceRange: searchParams.price }),
		ids: catalog.saleorProductIds,
	};

	if (catalog.saleorProductIds.length === 0) {
		return <StreamerCatalogClient products={[]} pageInfo={emptyPageInfo} />;
	}

	const result = await executePublicGraphQL(ProductListPaginatedDocument, {
		variables: {
			...paginationVariables,
			channel: params.channel,
			sortBy,
			filter,
		},
		revalidate: 300,
	});

	const products = result.ok ? result.data.products : null;
	if (!products) {
		notFound();
	}

	const productCards = products.edges.map((e) => transformToProductCard(e.node, params.channel));

	return <StreamerCatalogClient products={productCards} pageInfo={products.pageInfo} />;
}

const emptyPageInfo = {
	hasNextPage: false,
	hasPreviousPage: false,
	startCursor: null,
	endCursor: null,
};

async function getCatalogOrNull(slug: string): Promise<TachiyaStreamerCatalog | null> {
	const result = await getTachiyaStreamerCatalog(slug);
	return result.ok ? result.catalog : null;
}

function ProductsGridSkeleton() {
	return (
		<div className="mx-auto max-w-7xl animate-skeleton-delayed px-4 py-8 opacity-0 sm:px-6 lg:px-8">
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="animate-pulse">
						<div className="mb-4 aspect-[3/4] rounded-xl bg-muted" />
						<div className="space-y-1.5">
							<div className="h-4 w-3/4 rounded bg-muted" />
							<div className="h-4 w-1/2 rounded bg-muted" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
