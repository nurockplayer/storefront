import { CircleMinus, CirclePlus, Coins } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getTachiyaPointsBalance, getTachiyaPointsLedger } from "@/lib/tachiya-points";
import { buildPointsBalanceView, type PointsLedgerView } from "./points-balance-view";

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
	const [result, ledgerResult, t] = await Promise.all([
		getTachiyaPointsBalance(userId ?? ""),
		getTachiyaPointsLedger(userId ?? "", 3),
		getTranslations("account.pointsBalance"),
	]);
	const view = buildPointsBalanceView(
		result,
		{
			label: t("label"),
			emptyValue: t("emptyValue"),
			emptyDescription: t("emptyDescription"),
			unavailableLabel: t("unavailableLabel"),
			unavailableDescription: t("unavailableDescription"),
			notConfiguredDescription: t("notConfiguredDescription"),
			recentActivityLabel: t("recentActivityLabel"),
			ledgerEmptyDescription: t("ledgerEmptyDescription"),
			ledgerUnavailableDescription: t("ledgerUnavailableDescription"),
			creditLabel: t("creditLabel"),
			debitLabel: t("debitLabel"),
		},
		ledgerResult,
	);

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
			{view.ledger ? <PointsLedger ledger={view.ledger} /> : null}
		</div>
	);
}

function PointsLedger({ ledger }: { ledger: PointsLedgerView }) {
	return (
		<div className="mt-3 border-t pt-3">
			<div className="mb-2 text-xs font-medium uppercase text-muted-foreground">{ledger.label}</div>
			{ledger.status === "ready" ? (
				<ul className="space-y-2">
					{ledger.entries.map((entry) => {
						const isDebit = entry.amount.startsWith("-");
						const Icon = isDebit ? CircleMinus : CirclePlus;
						return (
							<li key={entry.id} className="grid grid-cols-[1rem_1fr_auto] items-start gap-2 text-xs">
								<Icon
									className={
										isDebit
											? "mt-0.5 h-3.5 w-3.5 text-muted-foreground"
											: "mt-0.5 h-3.5 w-3.5 text-emerald-600"
									}
								/>
								<div className="min-w-0">
									<div className="flex items-center gap-1">
										<span className="font-medium">{entry.kindLabel}</span>
										<span className="truncate text-muted-foreground">{entry.sourceType}</span>
									</div>
									<div className="truncate text-muted-foreground" title={entry.referenceId}>
										{entry.referenceId}
									</div>
								</div>
								<div className="text-right">
									<div className="font-medium tabular-nums">{entry.amount}</div>
									<time className="text-muted-foreground" dateTime={entry.createdAt}>
										{entry.createdAt.slice(0, 10)}
									</time>
								</div>
							</li>
						);
					})}
				</ul>
			) : (
				<p className="text-xs text-muted-foreground">{ledger.description}</p>
			)}
		</div>
	);
}
