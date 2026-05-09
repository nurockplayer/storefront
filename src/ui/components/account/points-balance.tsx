import { Coins } from "lucide-react";
import { getTachiyaPointsBalance } from "@/lib/tachiya-points";

interface PointsBalanceProps {
	userId: string;
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
	const result = await getTachiyaPointsBalance(userId);

	if (!result.ok) {
		return (
			<div className="mt-6 hidden rounded-lg border px-3.5 py-3 text-sm md:block">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Coins className="h-4 w-4" />
					<span>Points unavailable</span>
				</div>
			</div>
		);
	}

	return (
		<div className="mt-6 hidden rounded-lg border px-3.5 py-3 md:block">
			<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
				<Coins className="h-3.5 w-3.5" />
				<span>Points</span>
			</div>
			<p className="text-2xl font-semibold tabular-nums">{result.balance.toLocaleString()}</p>
		</div>
	);
}
