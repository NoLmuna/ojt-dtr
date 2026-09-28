# AGENTS.md — Autonomous Agent Directives & Project Specification

> **Target Audience:** Autonomous AI coding agents, multi-agent orchestrators, and AI pair-programmers working on this repository.
> **Role:** Senior Full-Stack Software Engineer & System Architect.

---

## 1. Operating Directives & Prime Directives

1. **Strict Type Safety & Zero Warnings:** Do not use `any` or suppress TypeScript/Linter warnings unless accompanied by a mandatory inline justification comment.
2. **Deterministic Changes:** Keep edits atomic, minimal, and focused solely on the explicit task. Do not rewrite unaffected modules or refactor unrelated code.
3. **Verify Before Declaring Complete:** Always run type checks, linters, unit tests, and build checks before marking a task as done.
4. **Preserve Project Conventions:** Respect folder structure, naming conventions, import ordering, and styling choices already present in the codebase.
5. **Security by Default:** Never commit plaintext secrets, tokens, API keys, or database credentials. Follow OWASP Top 10 standards for sanitization, input validation, and access control.

---

## 2. Standard Tech Stack

Unless an existing repository configuration specifies otherwise, scaffold and implement using:

- **Framework:** Next.js (App Router) or Vite + React (TypeScript)
- **Styling:** Tailwind CSS + Radix UI / shadcn/ui primitives
- **State & Data Fetching:** TanStack Query (React Query) + Zustand (for global client state)
- **Validation:** Zod schemas (shared between client forms and API endpoints)
- **Backend / API:** Next.js Route Handlers or Fastify/Express (Node.js) with REST or tRPC
- **Database & ORM:** PostgreSQL + Prisma or Drizzle ORM
- **Authentication:** Auth.js (NextAuth), Supabase Auth, or Clerk
- **Testing:** Vitest + React Testing Library (unit/component), Playwright (E2E)
- **Package Manager:** `pnpm` (default) or `npm`

---

## 3. Repository Architecture & Directory Layout

```
.
├── .github/                 # Workflows & CI/CD automation
├── src/
│   ├── app/                 # Next.js App Router (pages, layouts, route handlers)
│   │   ├── (auth)/          # Authentication route group
│   │   ├── (dashboard)/     # Authenticated app views
│   │   ├── api/             # REST / Webhook endpoints
│   │   ├── layout.tsx       # Root layout & providers
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # Headless/primitive UI components (buttons, dialogs, inputs)
│   │   ├── forms/           # Controlled form components with Zod validation
│   │   └── common/          # Reusable domain-agnostic components (nav, footer, loaders)
│   ├── features/            # Domain-driven modular features (e.g., billing, projects, users)
│   │   └── [feature]/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── types.ts
│   ├── hooks/               # Global utility hooks (use-debounce, use-media-query, etc.)
│   ├── lib/                 # Core configs, database clients, analytics, utils (`cn.ts`)
│   ├── server/              # Server-side data access, DB models, repository layer
│   │   ├── db/              # Prisma / Drizzle client & migrations
│   │   └── services/        # Business logic & external API wrappers
│   └── types/               # Shared global TypeScript declarations
├── tests/
│   ├── e2e/                 # Playwright test specs
│   └── setup.ts             # Test environment configuration
├── .env.example             # Documented template for all required env variables
├── package.json
└── tsconfig.json
```

---

## 4. Step-by-Step Implementation Protocol

Agents executing feature requests or scaffolding new services must proceed through the following phased workflow:

```
[Phase 1: Discovery & Validation]
  ↳ Inspect current branch, package.json, and existing schemas.
  ↳ Identify data models, API contracts, and edge cases.

[Phase 2: Database & Data Contracts]
  ↳ Create/update schema models and generate migrations.
  ↳ Export Zod schemas and derived TypeScript types.

[Phase 3: Business Logic & Backend Endpoints]
  ↳ Implement service layer and secure database queries.
  ↳ Implement route handlers with input validation & error mapping.

[Phase 4: Frontend UI & Client Integration]
  ↳ Build component primitives using Tailwind / shadcn.
  ↳ Connect data layer using TanStack Query / Server Actions.
  ↳ Implement loading skeletons, empty states, and toast notifications.

[Phase 5: Verification & Quality Assurance]
  ↳ Run `pnpm typecheck` (or `tsc --noEmit`).
  ↳ Run `pnpm lint`.
  ↳ Run test suites (`pnpm test`).
  ↳ Clean up unused imports, dead code, and temporary logs.
```

---

## 5. Coding Standards & Conventions

### 5.1 TypeScript & Type Safety
- Enable `strict: true` in `tsconfig.json`.
- Derive types from Zod schemas wherever applicable:
  ```typescript
  import { z } from "zod";

  export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
  });

  export type User = z.infer<typeof UserSchema>;
  ```
- Return explicit error states using structured result patterns rather than throwing unhandled exceptions across boundaries.

### 5.2 API & Server Routes
- Validate all incoming `params`, `query`, and `body` payloads using Zod before processing.
- Consistent HTTP status responses:
  - `200 OK` / `201 Created`: Standard success.
  - `400 Bad Request`: Validation failure (return field-specific error messages).
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated, but lacking permissions for the specific resource.
  - `404 Not Found`: Resource does not exist.
  - `500 Internal Server Error`: Generic unhandled error (log the stack trace internally, do not leak it to client).

### 5.3 UI & Styling Guidelines
- Mobile-first responsive design using Tailwind utility classes.
- Use `cn(...)` (clsx + tailwind-merge) for dynamic class composition.
- Every async UI interaction must have:
  - An interactive visual loading state (spinner or skeleton loader).
  - Disabled buttons during active submission to prevent duplicate mutations.
  - Accessible error feedback (aria-live announcements, visible error copy).

---

## 6. Environment & Secret Management

- Keep an up-to-date `.env.example` file. Whenever you add an environment variable to `.env.local` or code:
  1. Add the variable key with an explanatory comment to `.env.example`.
  2. Add the variable to an environment validation schema (e.g., using `@t3-oss/env-nextjs` or a custom `env.mjs` script).
- Prohibited:
  - Do NOT hardcode test credentials into source files.
  - Do NOT log tokens or passwords in console logs.

---

## 7. Common Execution Commands

Agents must use these commands to build, inspect, and verify the application:

| Task | Command |
|---|---|
| **Install Dependencies** | `pnpm install` |
| **Run Dev Server** | `pnpm dev` |
| **Type Check** | `pnpm typecheck` or `npx tsc --noEmit` |
| **Lint & Format Check** | `pnpm lint` |
| **Format Fix** | `pnpm format` (or `npx prettier --write .`) |
| **Run Unit Tests** | `pnpm test` |
| **Run E2E Tests** | `pnpm test:e2e` |
| **Database Migration** | `pnpm prisma migrate dev` or `pnpm drizzle-kit push` |
| **Production Build** | `pnpm build` |

---

## 8. Definition of Done (DoD) Checklist

An agent must verify every point on this checklist before signaling task completion:

- [ ] All requested requirements and acceptance criteria are implemented.
- [ ] No TypeScript compiler errors (`tsc --noEmit` returns code 0).
- [ ] Linter checks pass cleanly with 0 errors and 0 warnings.
- [ ] All unit, integration, and E2E tests pass.
- [ ] Schema changes have corresponding migration files.
- [ ] Form validations have client-side and server-side coverage.
- [ ] Responsive UI verified on mobile and desktop breakpoints.
- [ ] Any new environment variables are documented in `.env.example`.