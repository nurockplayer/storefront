import { Suspense } from "react";
import {
	ProductListByCollectionDocument,
	ProductOrderField,
	OrderDirection,
	HomepageBannerDocument,
} from "@/gql/graphql";
import { executePublicGraphQL } from "@/lib/graphql";
import { ProductList } from "@/ui/components/product-list";
import { Banner } from "@/ui/components/banner";

export const metadata = {
	title: "ACME Storefront, powered by Saleor & Next.js",
	description:
		"Storefront Next.js Example for building performant e-commerce experiences with Saleor - the composable, headless commerce platform for global brands.",
};

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

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const bannerPage = await getHomepageBanner();

	return (
		<>
			{bannerPage && <Banner page={bannerPage} />}
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
