# Mission Control

Mission Control is an independent product concept for operating, inspecting, governing, and releasing AI-assisted workflows across membership, events, learning, community, and other mission-driven systems.

The product is demonstrated through **Northstar Professional Association**, a fictional national membership organization that helps business, technology, and operations professionals advance their careers through education, events, mentoring, career services, and community. Northstar is the customer organization; its membership, events, community, and governance teams operate Mission Control; Sarah Chen and the other synthetic people are Northstar members.

It is designed as a working product rather than a static dashboard: users can screen complete synthetic populations across retention, moderation, and event growth; inspect evidence and component boundaries; edit and approve individual or bulk-eligible actions; inspect exact simulated outreach/action history; and adjust governance thresholds.

The Overview is derived from the current operating session rather than invented historical KPIs. Governance publishes a shared session policy version and recalculates active workflow queues using deterministic rules outside Claude. Human Review preserves the evidence, policy trigger, editable content, and final decision for every consequential action.

> Independent product concept by Akash Sangami. This project is not affiliated with or endorsed by Momentive Software and is not based on confidential information.

## Product hypothesis

A shared agent control plane can help product teams reuse context, tool, review, and governance infrastructure while keeping product-specific logic explicit. The product deliberately uses a hybrid architecture: APIs retrieve, deterministic systems score and enforce policy, a model handles ambiguous recommendation work, and humans authorize consequential action.

## Architecture

- **Next.js App Router + React + TypeScript** for the product and server route
- **Tailwind CSS** for the visual system, responsive behavior, and accessible interaction states
- **Zod** for request and model-output validation
- **Anthropic TypeScript SDK** for server-only Claude structured output
- **Vitest** for domain and API behavior
- **Playwright** for critical desktop and mobile flows

The browser calls `/api/workflow-runs` with a validated workflow ID. Deterministic screening first identifies the records that need attention; the server then asks the pinned Claude model for schema-constrained recommendations for those candidates, validates the response with Zod, and applies authorization policy outside the model. The secret never enters a client bundle.

## AI and Demo Simulation

The default model is the official pinned `claude-sonnet-4-6` ID, verified against Anthropic’s current model documentation when the concept was built. It can be overridden with `ANTHROPIC_MODEL`.

If the API key is absent, the request times out, the provider errors, or the response is malformed, the route returns a deterministic fixture. The response includes an explicit `source: "fixture"` field and `x-mission-control-mode: demo` header. The UI labels this state **Demo Simulation** and never represents it as Claude output.

The trace shows approved inputs, simulated connectors, structured outputs, confidence, latency, cost, and evidence. It intentionally does not expose hidden chain-of-thought or imply that demo connectors are live customer systems.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). An API key is optional.

## Environment variables

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
```

Keep `.env.local` out of source control. Only the server route reads these variables.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Automated coverage includes landing, Studio, case study, navigation, cohort screening in all three workflows, session-derived Overview state, policy publication and queue recalculation, editable messages, simulated action history, fallback behavior, global human review, mobile navigation, and 404 recovery.

## Project structure

```text
src/app/                  Routes, metadata, API endpoint, 404
src/components/           Brand, navigation, workflow and Studio UI
src/lib/                  Typed domain model and deterministic fixtures
src/test/                 Test setup
tests/                    End-to-end tests
docs/product-decisions.md Product rationale and validation assumptions
```

## Key product decisions

- Each workflow starts from the population an operator actually manages: members, community posts, or event opportunities.
- Membership retention highlights every at-risk member and creates a proposed outreach draft only when evidence, consent, and policy allow it.
- Internal findings and recommendations never become recipient copy by concatenation; outbound drafts use a separate schema, safe fallback, and release-time language guard.
- Hybrid architecture keeps intelligence selective and operational boundaries clear.
- Deterministic policy lives outside the model.
- Financial action requires authorized human review.
- Governance changes operating state rather than presenting static policy documentation.
- All metrics and member data are visibly synthetic.

See [docs/product-decisions.md](docs/product-decisions.md) for the full rationale.

## Limitations and future validation

This concept does not connect to production customer systems, send real messages, apply real moderation actions, persist decisions to a database, authenticate roles, or report real outcomes. Sending and activation states are visibly simulated. A pilot would validate workflow demand, evidence sufficiency, permission design, thresholds, false-escalation rates, operational fit, and measurable member impact before enabling external actions.
