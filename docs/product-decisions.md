# Mission Control — Product Decisions

## Why this problem

Mission-driven organizations often use separate systems for membership, events, learning, community, fundraising, and operations. As AI capabilities enter each product, teams need shared infrastructure for context, tools, review, and governance without erasing product-specific rules or user needs.

## Who the demo customer is

Northstar Professional Association is a fictional national membership organization for business, technology, and operations professionals. It helps members advance their careers through education, conferences, mentoring, career services, local chapters, and an online community. Northstar is the customer and operating organization; Sarah Chen and every other person in the prototype are synthetic Northstar members. Its membership, events, community, and governance teams are the users of Mission Control.

## Why Membership Retention is the hero workflow

Retention combines fragmented behavioral signals, revenue impact, relationship quality, and a consequential outward action. It exposes the platform’s hard questions in one flow: whether a member is actually disengaged, which intervention fits their current intent, and when a financial recommendation must wait for a person.

The operator starts from the membership base, not a preselected person. Reproducible scoring highlights every at-risk member, after which context and model reasoning prepare candidate-specific interventions. Risk creates a review candidate rather than guaranteeing contact: missing evidence, consent, or policy can still block outreach.

## Why use a hybrid architecture

The workflow benefits from model reasoning only at the ambiguous recommendation step. Retrieval should remain API-driven, risk scoring reproducible, policies deterministic, and financial actions human-controlled. This makes boundaries inspectable and limits cost and latency without losing contextual judgment.

## Why not everything should be an agent

Agents add variability, latency, cost, context-management work, and new failure modes. A component should become an agent only when flexible reasoning materially improves the outcome. Predictable tasks remain ordinary software.

## Why policies are deterministic

Confidence thresholds, permission scope, evidence requirements, reversibility, and financial limits are organizational rules. They must be testable and consistently enforced outside the model; a prompt cannot be the final authorization layer.

## Why consequential actions require humans

Autonomy should be proportional to impact. A high-value financial offer changes both revenue and a member relationship. The workflow therefore prepares an evidence-backed recommendation but cannot release it without an authorized decision and audit event.

Grouped approval is limited to high-confidence, reversible, non-financial work. It lets a reviewer approve several eligible items in one decision; it does not bypass human approval. Consequential retention offers, ambiguous moderation decisions, and financial event campaigns remain individual decisions. Every approved demo action records the exact released message or operation and is explicitly labeled simulated.

## Why internal recommendations are not messages

An operator instruction such as “Invite Sarah” or “Hide the post” is useful inside a decision record and inappropriate as recipient-facing copy. Mission Control therefore models the internal finding, internal recommendation, and outward-facing draft as separate artifacts. The review interface labels that boundary explicitly, and release is blocked when a generated or edited draft contains scores, monitoring signals, policy details, targeting logic, or third-person operational instructions. If Claude returns unsafe copy, the server keeps the reviewed safe fixture instead.

## Why every stage is inspectable

Operators should not have to infer what a selected workflow node did. Each completed boundary exposes the data it received, the output it produced, the evidence it used, its operating limit, and the consequence for the next stage. This makes the interface useful for action and explanation without exposing hidden chain-of-thought.

## Why governance changes operating state

Governance is not a policy-document viewer. Publishing a session policy version recalculates active queues using the confidence floor, bulk-approval threshold, consequence level, evidence, and consent. Financial actions and consequential moderation remain individual decisions regardless of looser bulk settings, and Claude never receives execution authority.

## Why Overview avoids synthetic business KPIs

The operating overview reports only what happened in the current demo session: workflows run, records screened, decisions pending, blocked cases, and simulated actions released. It does not invent staff hours, protected revenue, or historical performance without a real measurement source.

## Why demo fallback exists

An external API outage, quota limit, malformed response, or absent key should never destroy the product demonstration. The server returns a deterministic, schema-compatible fixture and the interface labels it “Demo Simulation.” It never implies that fixture data came from Claude.

## What is synthetic

All people, member records, workflow counts, revenue values, staff-time estimates, latency, cost, and outcome metrics are synthetic. They demonstrate product behavior, not customer performance or benchmarks.

## What requires real customer validation

- Which workflows create enough leverage to justify shared platform infrastructure
- How staff determine whether evidence and explanations are sufficient
- Appropriate review and release thresholds by organization, role, product, and action type
- Acceptable false-positive, false-negative, and false-escalation rates
- Real integration and permission boundaries across source systems
- Whether recommended interventions improve renewal outcomes without harming trust
