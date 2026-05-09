import { Coins } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getTachiyaPointsBalance } from "@/lib/tachiya-points";
import { buildPointsBalanceView } from "./points-balance-view";

interface PointsBalanceProps {
	userId: string | null | undefined;
}

export function PointsBalanceSkeleton() {
	return (
		<div className="mt-6 hidden rounded-lg border px-3.5 py-3 md:block">
			<div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted" />
			<div className="h-6 w-24 animate-pulse rounded bg-muted" />
		</div>
	);
}

export async function PointsBalance({ userId }: PointsBalanceProps) {
	const [result, t] = await Promise.all([
		getTachiyaPointsBalance(userId ?? ""),
		getTranslations("account.pointsBalance"),
	]);
	const view = buildPointsBalanceView(result, {
		label: t("label"),
		emptyValue: t("emptyValue"),
		emptyDescription: t("emptyDescription"),
		unavailableLabel: t("unavailableLabel"),
		unavailableDescription: t("unavailableDescription"),
		notConfiguredDescription: t("notConfiguredDescription"),
	});

	if (view.status === "unavailable" || view.status === "not-configured") {
		return (
			<div className="mt-6 hidden rounded-lg border px-3.5 py-3 text-sm md:block">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Coins className="h-4 w-4" />
					<span>{view.label}</span>
				</div>
				<p className="mt-1 text-xs text-muted-foreground">{view.description}</p>
			</div>
		);
	}

	return (
		<div className="mt-6 hidden rounded-lg border px-3.5 py-3 md:block">
			<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
				<Coins className="h-3.5 w-3.5" />
				<span>{view.label}</span>
			</div>
			<p className="text-2xl font-semibold tabular-nums">{view.value}</p>
			{view.description ? <p className="mt-1 text-xs text-muted-foreground">{view.description}</p> : null}
		</div>
	);
}
