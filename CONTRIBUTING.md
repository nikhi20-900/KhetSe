# Contributing to KhetSe

KhetSe is an early-stage agricultural logistics demonstration. Read the [root README](README.md), [architecture](docs/ARCHITECTURE.md), [API contracts](docs/API_CONTRACTS.md), and [assumptions](docs/assumptions.md) before changing a feature. Keep simulated parameters and modeled outputs clearly distinguished from empirical data.

## Feature boundaries

The original team areas remain useful for coordination: Person 1 owns frontend/UI, Person 2 owns API/database integration, and Person 3 owns domain rules/simulation/QA. Current implementation and limitations are listed in [development status](docs/development-plan.md); the repository is no longer scaffold-only. Coordinate API contract changes across UI and route consumers before changing schemas.

## Local workflow

Use Node.js 20 (`.nvmrc`) and npm. From the repository root:

```bash
npm ci
npm run dev
npm test
npm run format:check
npm run type-check
npm run lint
```

Use `npm run format` only when you intend to format the repository. Database-backed routes require PostgreSQL and a schema; the harvest and incident demo flows use local JSON. Simulation Lab state and the farmer desk are in memory and must not be wired to shipment or reservation writes. A farmer-desk replay URL repeats a modeled preview; `POST /api/scenarios` is the separate database reset and must not be called from that desk. After `npm run build`, delete `.next` before `npm run dev` in the same checkout, because they share that cache. Do not commit `.env.local`, credentials, or local demo data.

## Pull requests and code standards

- Use a focused branch and pull request, link the relevant issue, and describe behavior and verification.
- Keep changes within the issue/contract boundaries and preserve unrelated work.
- Use strict TypeScript and existing Zod contracts for untrusted inputs.
- Run applicable formatting, type, lint, test, and docs checks; report checks that cannot run and why.
- Require peer review before merge, following the repository's existing PR process.
- Use the repository's existing Conventional Commit style when writing commits.

## Reporting issues

Search existing issues before opening a new one. Use templates under [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE/). Security concerns should follow [`SECURITY.md`](SECURITY.md), not be posted publicly.
