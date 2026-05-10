import type { TachiyaPointsBalanceResult, TachiyaPointsLedgerResult } from "@/lib/tachiya-points";

export interface PointsBalanceMessages {
	label: string;
	emptyValue: string;
	emptyDescription: string;
	unavailableLabel: string;
	unavailableDescription: string;
	notConfiguredDescription: string;
	recentActivityLabel: string;
	ledgerEmptyDescription: string;
	ledgerUnavailableDescription: string;
	creditLabel: string;
	debitLabel: string;
	expiresLabel: string;
	sourceLabels: {
		tachigo: string;
		orderReward: string;
		checkout: string;
		manual: string;
		referral: string;
	};
}

export type PointsBalanceView =
	| {
			status: "ready" | "empty";
			label: string;
			value: string;
			description: string | null;
			ledger: PointsLedgerView;
	  }
	| {
			status: "not-configured" | "unavailable";
			label: string;
			value: null;
			description: string;
			ledger: null;
	  };

export type PointsLedgerView = {
	status: "ready" | "empty" | "unavailable";
	label: string;
	description: string | null;
	entries: PointsLedgerEntryView[];
};

export interface PointsLedgerEntryView {
	id: string;
	amount: string;
	kindLabel: string;
	sourceLabel: string;
	referenceId: string;
	createdAt: string;
	expiresAt: string | null;
	expiresLabel: string | null;
}

export function buildPointsBalanceView(
	result: TachiyaPointsBalanceResult,
	messages: PointsBalanceMessages,
	ledgerResult?: TachiyaPointsLedgerResult,
): PointsBalanceView {
	if (!result.ok) {
		return {
			status:
				result.reason === "missing-config" || result.reason === "missing-user"
					? "not-configured"
					: "unavailable",
			label: messages.unavailableLabel,
			value: null,
			description:
				result.reason === "missing-config" || result.reason === "missing-user"
					? messages.notConfiguredDescription
					: messages.unavailableDescription,
			ledger: null,
		};
	}

	if (result.balance === 0) {
		return {
			status: "empty",
			label: messages.label,
			value: messages.emptyValue,
			description: messages.emptyDescription,
			ledger: buildLedgerView(ledgerResult, messages),
		};
	}

	return {
		status: "ready",
		label: messages.label,
		value: result.balance.toLocaleString(),
		description: null,
		ledger: buildLedgerView(ledgerResult, messages),
	};
}

function buildLedgerView(
	result: TachiyaPointsLedgerResult | undefined,
	messages: PointsBalanceMessages,
): PointsLedgerView {
	if (!result?.ok) {
		return {
			status: result ? "unavailable" : "empty",
			label: messages.recentActivityLabel,
			description: result ? messages.ledgerUnavailableDescription : messages.ledgerEmptyDescription,
			entries: [],
		};
	}

	if (result.entries.length === 0) {
		return {
			status: "empty",
			label: messages.recentActivityLabel,
			description: messages.ledgerEmptyDescription,
			entries: [],
		};
	}

	return {
		status: "ready",
		label: messages.recentActivityLabel,
		description: null,
		entries: result.entries.map((entry) => ({
			id: entry.id,
			amount: `${entry.amount > 0 ? "+" : ""}${entry.amount.toLocaleString()}`,
			kindLabel: entry.amount >= 0 ? messages.creditLabel : messages.debitLabel,
			sourceLabel: getSourceLabel(entry.sourceType, messages),
			referenceId: entry.referenceId,
			createdAt: entry.createdAt,
			expiresAt: entry.expiresAt,
			expiresLabel: buildExpiresLabel(entry.expiresAt, messages),
		})),
	};
}

function buildExpiresLabel(expiresAt: string | null, messages: PointsBalanceMessages): string | null {
	if (!expiresAt) {
		return null;
	}
	return `${messages.expiresLabel} ${expiresAt.slice(0, 10)}`;
}

function getSourceLabel(sourceType: string, messages: PointsBalanceMessages): string {
	const normalizedSourceType = sourceType.trim().toLowerCase();
	switch (normalizedSourceType) {
		case "tachigo":
			return messages.sourceLabels.tachigo;
		case "order-reward":
			return messages.sourceLabels.orderReward;
		case "checkout":
			return messages.sourceLabels.checkout;
		case "manual":
			return messages.sourceLabels.manual;
		case "referral":
			return messages.sourceLabels.referral;
		default:
			return sourceType;
	}
}
