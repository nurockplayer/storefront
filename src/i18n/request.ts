import { getRequestConfig } from "next-intl/server";
import { defaultLocale, type AppLocale, locales } from "./routing";

const messagesByLocale: Record<AppLocale, () => Promise<Record<string, unknown>>> = {
	"en-US": async () => (await import("../checkout/content/locales/en-US.json")).default,
	"zh-Hant": async () => (await import("../checkout/content/locales/zh-Hant.json")).default,
};

function resolveLocale(requestedLocale: string | undefined): AppLocale {
	return locales.includes(requestedLocale as AppLocale) ? (requestedLocale as AppLocale) : defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
	const locale = resolveLocale(await requestLocale);
	const messages = await messagesByLocale[locale]();

	return {
		locale,
		messages,
	};
});
