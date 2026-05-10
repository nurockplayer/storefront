# Codex Autonomous Workflow

This document defines the autonomous product-work policy for the nurockplayer storefront fork. It keeps issue/PR planning, worker delegation, automated review gates, and merge decisions auditable while this repo evolves as the Tachiya consumer storefront.

## Core Principles

- The controller agent owns architecture, scope, final review, guarded merge decisions, and closeout.
- Worker/subagent tasks should be small, bounded, and matched to risk.
- Low-risk GitHub, CI, terminal, and repo-readback tasks should prefer Spark or lower-cost workers.
- High-risk checkout, GraphQL, money, auth/session, cache, and SEO decisions require controller or high-reasoning review before merge.
- Pull requests must target the repository integration branch currently used for storefront work. If there is no enabled GitHub Issues tracker, the PR body must carry the source-of-truth plan, scope, non-goals, and validation evidence.
- Never treat a green CodeRabbit status alone as proof of review completion; skipped reviews can still report success.

## Worker Profiles

| Profile | Preferred model | Reasoning | Use |
| --- | --- | --- | --- |
| `controller` | GPT-5.5 | high / xhigh | Roadmap, architecture, scope, final review, merge decision |
| `ops_spark` | GPT-5.3-Codex-Spark | low / medium | GitHub PR metadata, labels, CI readback, routine terminal |
| `repo_scout` | GPT-5.3-Codex-Spark | medium | Fast codebase mapping, existing pattern lookup, test-gap summaries |
| `docs_worker` | GPT-5.3-Codex-Spark | medium | Docs, PR body, review evidence, agent policy updates |
| `test_worker` | GPT-5.4-mini / GPT-5.4 | medium / high | Vitest coverage, fixture cleanup, regression tests |
| `graphql_worker` | GPT-5.5 | high / xhigh | GraphQL documents, codegen impact, nullable contract review |
| `checkout_worker` | GPT-5.5 | high | Checkout, cart, auth/session, payment-adjacent flows |
| `frontend_worker` | GPT-5.4 | medium / high | Next.js App Router pages, Server/Client Components, Tailwind UI |
| `cache_seo_worker` | GPT-5.4 | high | ISR, revalidation, metadata, canonical URLs, OG images |
| `integration_worker` | GPT-5.4 | high | Tachiya API integration, environment contracts, deployment checks |
| `review_worker` | GPT-5.4 / GPT-5.5 | high | PR diff review, regression risk, missing tests, release readiness |

Model names are preferred profiles, not hard requirements. If a model is unavailable, the controller must choose a conservative equivalent and record the substitution in the task summary.

## Routing Rules

| Scenario | Default assignment |
| --- | --- |
| GitHub PR/check/review readback | `ops_spark` |
| CI log triage and routine terminal commands | `ops_spark` |
| Large code search or project structure mapping | `repo_scout` |
| Documentation and PR body drafting | `docs_worker` |
| Unit/component test additions | `test_worker` |
| GraphQL query/mutation/schema/codegen changes | `graphql_worker` |
| Checkout/cart/account/session flows | `checkout_worker` |
| General storefront UI and copy changes | `frontend_worker` |
| Cache, revalidation, SEO, metadata | `cache_seo_worker` |
| Tachiya API or cross-repo integration | `integration_worker` |
| Merge-readiness review | `review_worker`, then controller final decision |

## Automated Review Gate

Before merging any autonomous PR, the controller must complete a fresh review readback:

1. Confirm latest PR head SHA, base branch, mergeability, and CI/check status.
2. Confirm CodeRabbit has produced a real review for the PR, or document why it is unavailable.
3. Confirm `chatgpt-codex-connector` has produced a review/comment when expected, or document why it is unavailable.
4. For every actionable automated review finding, choose exactly one path before merge:
   - fix it, push the fix, and rerun relevant validation;
   - leave a technical rationale comment explaining why it is not adopted.
5. Resolve or explicitly close out handled review threads/comments where GitHub permits it.
6. Re-read the latest head SHA after any fix before merge.

CodeRabbit is configured in `.coderabbit.yaml` with `reviews.auto_review.base_branches: [".*"]` so auto review can run for PRs targeting any branch, not just the default branch.

## Validation Policy

- Run `pnpm run generate:all` after GraphQL document changes.
- Run `pnpm exec tsc --noEmit` for TypeScript contract changes.
- Run `pnpm run lint` for code changes.
- Run `pnpm test:run` for logic, cart, checkout, account, or helper changes.
- Run `pnpm run build` for release-facing or integration changes.
- Docs/config-only changes require at least file/link sanity checks and YAML/config parsing where applicable.

## Storage Boundaries

| Location | Purpose |
| --- | --- |
| `docs/codex-autonomous-workflow.md` | Team-visible autonomous policy and worker profile reference |
| `AGENTS.md` | Short entrypoint for agent behavior and commands |
| `.coderabbit.yaml` | CodeRabbit auto-review policy |
| Codex memory | Personal/historical preference aid; not the only source of truth |

## Out of Scope

- Implementing a CLI router or daemon for automatic model switching.
- Adding CI workflows beyond review policy.
- Changing storefront product behavior.
- Enabling GitHub Issues for this repository.
