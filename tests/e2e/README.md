# Storefront E2E Smoke Tests

The Playwright suite starts a local mock service before Next.js:

- `http://127.0.0.1:3010/graphql/` provides deterministic Saleor GraphQL responses.
- `http://127.0.0.1:3010/tachiya` provides deterministic Tachiya API responses.
- `POST /__e2e/state` switches points API modes per smoke test.

Run the focused smoke suite with:

```bash
pnpm exec playwright test --project=chromium tests/e2e/storefront-smoke.spec.ts
```

The points/revenue/referral smoke covers:

- successful balance and recent referral/order reward activity;
- balance request failure fallback;
- malformed ledger fallback while preserving the loaded balance card.
