const DEFAULT_CONFIRMATION_PREFIX = "TACHIYA";

export function buildCheckoutConfirmationReference(
	checkoutId: string,
	prefix = DEFAULT_CONFIRMATION_PREFIX,
): string {
	const normalizedPrefix = normalizeReferencePart(prefix) || DEFAULT_CONFIRMATION_PREFIX;
	const normalizedCheckoutId = normalizeReferencePart(checkoutId);
	const suffix = normalizedCheckoutId.slice(-8) || randomReferenceSuffix();

	return `${normalizedPrefix}-${suffix}`;
}

function normalizeReferencePart(value: string): string {
	return [...value.trim().toUpperCase()].filter((character) => /[A-Z0-9]/.test(character)).join("");
}

function randomReferenceSuffix(): string {
	return Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
}
