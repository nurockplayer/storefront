import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 3010;
const internalSecret = process.env.TACHIYA_INTERNAL_SHARED_SECRET ?? "e2e-secret";

const currentUser = {
	id: "user-1",
	email: "e2e@example.com",
	firstName: "E2E",
	lastName: "User",
	avatar: null,
	dateJoined: "2026-05-14T00:00:00.000Z",
	addresses: [],
	defaultShippingAddress: null,
	defaultBillingAddress: null,
};

const defaultState = {
	balanceMode: "success",
	ledgerMode: "success",
};

const state = { ...defaultState };

function sendJson(response, statusCode, body) {
	response.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
	});
	response.end(JSON.stringify(body));
}

function notFound(response) {
	sendJson(response, 404, { error: "Not found" });
}

function readJson(request) {
	return new Promise((resolve, reject) => {
		let raw = "";
		request.setEncoding("utf8");
		request.on("data", (chunk) => {
			raw += chunk;
		});
		request.on("end", () => {
			if (!raw) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(raw));
			} catch (error) {
				reject(error);
			}
		});
		request.on("error", reject);
	});
}

function normalizeOperationName(body) {
	if (typeof body?.operationName === "string" && body.operationName.trim()) {
		return body.operationName.trim();
	}
	if (typeof body?.query !== "string") {
		return "";
	}

	const query = body.query;

	for (const operationName of knownGraphqlOperations) {
		if (query.includes(operationName)) {
			return operationName;
		}
	}

	return "";
}

const knownGraphqlOperations = [
	"ChannelsList",
	"MenuGetBySlug",
	"CurrentUserProfile",
	"CurrentUserOrdersPaginated",
	"CurrentUser",
	"ProductListPaginated",
	"ProductListByCollection",
	"HomepageBanner",
];

function buildUnknownOperationError(operationName) {
	const normalizedOperationName =
		typeof operationName === "string" && operationName.trim() ? operationName.trim() : "unknown";

	return {
		errors: [
			{
				message: `Unknown mock GraphQL operation: ${normalizedOperationName}`,
				extensions: {
					code: "MOCK_GRAPHQL_OPERATION_NOT_IMPLEMENTED",
					operationName: normalizedOperationName,
					knownOperations: knownGraphqlOperations,
				},
			},
		],
	};
}

function buildGraphqlResponse(operationName, variables) {
	switch (operationName) {
		case "ChannelsList":
			return {
				data: {
					channels: [
						{
							id: "channel-1",
							name: "Default Channel",
							slug: "default-channel",
							currencyCode: "USD",
							defaultCountry: {
								code: "US",
								country: "United States",
							},
							isActive: true,
						},
					],
				},
			};
		case "MenuGetBySlug":
			return {
				data: {
					menu: {
						id: `menu-${variables?.slug ?? "default"}`,
						name: variables?.slug ?? "default",
						items: [],
					},
				},
			};
		case "CurrentUser":
		case "CurrentUserProfile":
			return {
				data: {
					me: currentUser,
				},
			};
		case "CurrentUserOrdersPaginated":
			return {
				data: {
					me: {
						...currentUser,
						orders: {
							edges: [],
							pageInfo: {
								hasNextPage: false,
								endCursor: null,
							},
							totalCount: 0,
						},
					},
				},
			};
		case "ProductListPaginated":
		case "ProductListByCollection":
			return {
				data: {
					products: {
						edges: [],
						pageInfo: {
							hasNextPage: false,
							endCursor: null,
						},
					},
				},
			};
		case "HomepageBanner":
			return {
				data: {
					page: null,
				},
			};
		default:
			return buildUnknownOperationError(operationName);
	}
}

function buildLedgerEntries() {
	return [
		{
			id: "ledger-1",
			amount: 250,
			entry_type: "credit",
			source_type: "referral",
			reference_id: "referral-2026-001",
			expires_at: null,
			created_at: "2026-05-14T10:00:00.000Z",
		},
		{
			id: "ledger-2",
			amount: 984,
			entry_type: "credit",
			source_type: "order-reward",
			reference_id: "order-2026-042",
			expires_at: null,
			created_at: "2026-05-13T09:30:00.000Z",
		},
	];
}

function buildStreamerList() {
	return {
		streamers: [
			{
				slug: "e2e-streamer",
				display_name: "E2E Streamer",
				saleor_collection_id: null,
			},
		],
	};
}

const server = createServer(async (request, response) => {
	const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);

	if (request.method === "GET" && requestUrl.pathname === "/health") {
		sendJson(response, 200, { ok: true });
		return;
	}

	if (request.method === "POST" && requestUrl.pathname === "/__e2e/state") {
		try {
			const body = await readJson(request);
			state.balanceMode = body.balanceMode === "failure" ? "failure" : "success";
			if (body.ledgerMode === "failure" || body.ledgerMode === "malformed") {
				state.ledgerMode = body.ledgerMode;
			} else {
				state.ledgerMode = "success";
			}
			sendJson(response, 200, { ok: true, state });
		} catch {
			sendJson(response, 400, { ok: false, error: "Invalid JSON" });
		}
		return;
	}

	if (request.method === "POST" && requestUrl.pathname === "/graphql/") {
		try {
			const body = await readJson(request);
			const operationName = normalizeOperationName(body);
			sendJson(response, 200, buildGraphqlResponse(operationName, body.variables));
		} catch {
			sendJson(response, 400, { errors: [{ message: "Invalid JSON" }] });
		}
		return;
	}

	if (requestUrl.pathname === "/tachiya/points/balance" || requestUrl.pathname === "/tachiya/points/ledger") {
		if (request.headers["x-tachiya-internal-secret"] !== internalSecret) {
			sendJson(response, 403, { error: "Forbidden" });
			return;
		}

		const userId = requestUrl.searchParams.get("user_id")?.trim();
		if (!userId) {
			sendJson(response, 400, { error: "Missing user_id" });
			return;
		}
	}

	if (request.method === "GET" && requestUrl.pathname === "/tachiya/points/balance") {
		if (state.balanceMode === "failure") {
			sendJson(response, 503, { error: "Balance unavailable" });
			return;
		}
		sendJson(response, 200, {
			user_id: requestUrl.searchParams.get("user_id"),
			balance: 1234,
		});
		return;
	}

	if (request.method === "GET" && requestUrl.pathname === "/tachiya/points/ledger") {
		if (state.ledgerMode === "failure") {
			sendJson(response, 503, { error: "Ledger unavailable" });
			return;
		}
		if (state.ledgerMode === "malformed") {
			sendJson(response, 200, {
				user_id: requestUrl.searchParams.get("user_id"),
				entries: [{ id: "broken-entry", amount: "oops" }],
			});
			return;
		}
		sendJson(response, 200, {
			user_id: requestUrl.searchParams.get("user_id"),
			entries: buildLedgerEntries(),
		});
		return;
	}

	if (request.method === "GET" && requestUrl.pathname === "/tachiya/streamers") {
		if (request.headers["x-tachiya-internal-secret"] !== internalSecret) {
			sendJson(response, 403, { error: "Forbidden" });
			return;
		}
		sendJson(response, 200, buildStreamerList());
		return;
	}

	notFound(response);
});

server.listen(port, host, () => {
	console.log(`Mock Saleor/Tachiya server listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		server.close(() => {
			process.exit(0);
		});
	});
}
