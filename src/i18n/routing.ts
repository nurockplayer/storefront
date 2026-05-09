import { defineRouting } from "next-intl/routing";

export const locales = ["en-US", "zh-Hant"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en-US";
export const localePrefix = "never" as const;

export const routing = defineRouting({
	locales,
	defaultLocale,
	localePrefix,
});
