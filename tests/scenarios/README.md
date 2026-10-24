# Scenario and fixture tests

`demo-baseline.test.mjs` runs under Vitest and exercises the canonical fixture reference model in [`scripts/reference-model.mjs`](../../scripts/reference-model.mjs), not an end-to-end browser session or the PostgreSQL API. It checks fixture provenance and units, route/capacity constraints, six scenario outcomes, boundaries, deterministic results, comparison inputs, and positive/negative intervention examples.

The fixture source is [`data/demo-baseline.json`](../../data/demo-baseline.json), with evidence in [`data/evidence-register.json`](../../data/evidence-register.json). Both contain simulated demonstration values. `npm test` runs these checks, `npm run demo` prints their outcomes, and `npm run docs:check` verifies generated assumptions and evidence documents. The test directory does not yet contain a browser-driven scenario suite.
