# Contributing to KhetSe

Thank you for your interest in contributing to **KhetSe** — a software-only agricultural harvest logistics coordination platform.

---

## 1. Project Philosophy & Current Status

> **Important**: This repository is currently in a **Scaffold-Only** state.
> Application logic, active database handlers, and simulation calculations are intentionally unimplemented pending milestone development.
> Contributions must adhere strictly to issue specifications and avoid introducing ad-hoc or unverified logic.

---

## 2. Team Roles & Ownership

Contributions are coordinated across three defined functional roles:

- **Person 1 — Frontend & UX (`nikhi20-900`)**:
  - UI layouts, dashboard, harvest intake, plan comparison, shipment timeline, incident recovery prompts, post-shipment reports.
- **Person 2 — Backend & Database**:
  - Next.js API route handlers, PostgreSQL & Prisma schema, database migrations, transactional capacity reservations, shipment lifecycle persistence.
- **Person 3 — Domain Logic, Simulation & QA**:
  - Feasibility ranking rules, virtual-clock discrete simulation, financial and quality decay calculations, counterfactual evaluations, unit/integration/scenario testing.

---

## 3. Branching & Workflow

We follow a disciplined branch strategy to ensure stable integration:

### Branch Structure

- `main`: Protected, stable integration branch. All code must pass CI before merging.
- `chore/project-scaffold`: Scaffold baseline and configuration changes.
- `feat/frontend-dashboard`: Frontend UI components and page layouts (Person 1).
- `feat/backend-api-db`: Backend API routes, Prisma schemas, and persistence (Person 2).
- `feat/domain-simulation`: Domain models, simulation engine, and test suites (Person 3).
- `integration/mvp`: Final end-to-end integration branch.

### Step-by-Step Workflow

1. **Pull Latest Main**: Always start by checking out `main` and running `git pull origin main`.
2. **Work within Assigned Files**: Limit modifications to files aligned with your role and issue scope.
3. **Run Verification Commands**:
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   npm run validate-scaffold
   ```
4. **Open a Pull Request**:
   - Target the appropriate feature or `main` branch.
   - Use the provided PR template.
   - Link the relevant GitHub issue (e.g., `Closes #2` or `Addresses #4`).
5. **Code Review & Conflict Resolution**: At least one other team member must review the PR.
6. **Merge**: Merge only when all CI automated checks pass.

---

## 4. Code Standards

- **TypeScript**: Strict mode enabled. No `any` types without explicit justification.
- **Components**: Functional components in React 19 / Next.js 15 App Router.
- **Formatting**: Format all files using Prettier (`npm run format`).
- **Commits**: Use conventional commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `test:`).

---

## 5. Reporting Issues

Please search existing issues before opening a new one. When filing a bug or requesting a feature, use the issue templates in `.github/ISSUE_TEMPLATE/`.
