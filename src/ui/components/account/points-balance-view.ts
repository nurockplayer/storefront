import type { TachiyaPointsBalanceResult } from "@/lib/tachiya-points";

export interface PointsBalanceMessages {
	label: string;
	emptyValue: string;
	emptyDescription: string;
	unavailableLabel: string;
	unavailableDescription: string;
	notConfiguredDescription: string;
}

export type PointsBalanceView =
	| {
			status: "ready" | "empty";
			label: string;
			value: string;
			description: string | null;
	  }
	| {
			status: "not-configured" | "unavailable";
			label: string;
			value: null;
			description: string;
	  };

export function buildPointsBalanceView(
	result: TachiyaPointsBalanceResult,
	messages: PointsBalanceMessages,
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
		};
	}

	if (result.balance === 0) {
		return {
			status: "empty",
			label: messages.label,
			value: messages.emptyValue,
			description: messages.emptyDescription,
		};
	}

	return {
		status: "ready",
		label: messages.label,
		value: result.balance.toLocaleString(),
		description: null,
	};
}
