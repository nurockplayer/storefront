import Image from "next/image";
import type { HomepageBannerQuery } from "@/gql/graphql";

type Props = {
	page: NonNullable<HomepageBannerQuery["page"]>;
};

export function Banner({ page }: Props) {
	const imageAttr = page.attributes.find((a) => a.attribute.slug === "banner-image");
	const imageUrl = imageAttr?.values[0]?.plainText;

	if (!imageUrl) {
		return null;
	}

	const altAttr = page.attributes.find((a) => a.attribute.slug === "banner-alt");
	const alt = altAttr?.values[0]?.plainText ?? page.title;

	return (
		<div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/5" }}>
			<Image src={imageUrl} alt={alt} fill className="object-cover" priority />
		</div>
	);
}
