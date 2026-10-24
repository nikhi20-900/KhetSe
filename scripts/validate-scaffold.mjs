import fs from "fs";
import path from "path";

console.log("=================================================");
console.log("KhetSe CI: Truthful Scaffold Validation");
console.log("=================================================");

const requiredPaths = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/globals.css",
  "app/harvests/new/page.tsx",
  "app/plans/page.tsx",
  "app/shipments/[id]/page.tsx",
  "app/incidents/[id]/page.tsx",
  "app/reports/[id]/page.tsx",
  "app/api/harvests/route.ts",
  "app/api/plans/route.ts",
  "app/api/reservations/route.ts",
  "app/api/shipments/route.ts",
  "app/api/incidents/route.ts",
  "app/api/reports/route.ts",
  "components/layout/README.md",
  "components/harvest/README.md",
  "components/planning/README.md",
  "components/shipments/README.md",
  "components/incidents/README.md",
  "components/reports/README.md",
  "components/ui/README.md",
  "lib/contracts/README.md",
  "lib/db/README.md",
  "lib/domain/README.md",
  "lib/domain/feasibility.ts",
  "lib/domain/booking.ts",
  "lib/domain/state-machine.ts",
  "lib/domain/simulation.ts",
  "lib/domain/financials.ts",
  "lib/domain/counterfactual.ts",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "tests/unit/README.md",
  "tests/integration/README.md",
  "tests/scenarios/README.md",
  "docs/ARCHITECTURE.md",
  "docs/TEAM_RESPONSIBILITIES.md",
  "docs/API_CONTRACTS.md",
  "docs/DATA_MODEL.md",
  "docs/assumptions.md",
  "docs/development-plan.md",
  "docs/issue-backlog.md",
  "docs/demo-flow.md",
  ".github/ISSUE_TEMPLATE/feature_request.md",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/workflows/ci.yml",
  ".github/pull_request_template.md",
  ".env.example",
  ".gitignore",
  ".nvmrc",
  ".prettierrc.json",
  "eslint.config.mjs",
  "next.config.ts",
  "package.json",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "vitest.config.ts",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "LICENSE",
  "README.md",
];

let missing = 0;
for (const relPath of requiredPaths) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] Missing required scaffold file: ${relPath}`);
    missing++;
  } else {
    // Check that placeholders do not have fake secrets
    const content = fs.readFileSync(fullPath, "utf-8");
    if (
      content.includes("sk_live_") ||
      content.includes("ghp_") ||
      content.includes("aws_secret")
    ) {
      console.error(`[SECURITY ALERT] Potential secret found in: ${relPath}`);
      missing++;
    }
  }
}

if (missing > 0) {
  console.error(`Scaffold validation failed: ${missing} errors detected.`);
  process.exit(1);
} else {
  console.log(`[SUCCESS] All ${requiredPaths.length} scaffold files verified.`);
  console.log(
    "Notice: Functional tests are pending feature implementation (Issues #1-#8)."
  );
}
