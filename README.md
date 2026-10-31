# Presence - BaselHack 2026

Research, pitch and reviewed implementation specification for Adobe's **The Post-Website Business** challenge. Planning only: application implementation has not started. This repository is private.

> Your next customer is an agent. Your business should be ready.

Presence proposes a business-controlled commerce layer for independent hotels: publish approved facts and capabilities, handle agent requests through the merchant's existing inbox, and reconnect with customers through explicit subscriptions. The clarified scope is one fictional Basel hotel and **three live demo moments: publish, transact through real email, reconnect with permission**. A standalone Next.js presentation interface uses Tailwind v4 and shadcn/ui. The presenter operates the flow; owner and traveller authority remain distinct.

The team reports that ideation began on **30 October 2026 at 20:30 Europe/Zurich**. The [decision log](docs/decision-log.md) preserves that timeline and the reasons behind the scope. Git history records the actual commits.

## What exists

- [Complete plan](docs/plan.md): preserved concept, evidence, market sizing, seven-slide / three-minute pitch, demo storyboard, milestones, stack, API and benchmark design.
- [Critical review](docs/plan-review.md): concrete weaknesses in version 1 and their corrections.
- [Implementation specification](docs/implementation-spec.md): actors, screen flows, visual contract, selected stack, data/state invariants, module ownership and acceptance gates.
- [Design preview](output/design/presence-demo-preview.svg): native-vector visual direction, not a screenshot of working software.
- [Architecture](docs/architecture.md): editable C4 context, container and component diagrams, plus asynchronous booking sequence.
- [Sources](docs/sources.md): primary sources and evidence limitations.
- [Challenge brief](docs/challenge-brief.md): recovered challenge content, without participant/contact data.
- [PDF](output/pdf/presence-hackathon-plan.pdf): shareable plan including rendered architecture diagrams and source register.

Generated on 31 October 2026. No measured prototype results or revenue uplift are claimed. Prices and financial scenarios are explicitly hypothetical.

## Proposed implementation

One shared Next.js/TypeScript application with Tailwind v4/shadcn/ui, Better Auth, Postgres/Drizzle/Zod, pg-boss, Vercel AI SDK/Gateway, Codex-backed onboarding and Resend. Customer onboarding produces versioned configuration, not customer-specific applications. Docker Compose packages web, worker and database; native Codex credentials remain in an explicitly host-side integration. These are selected architecture decisions, not installed or tested integrations.

## Reproduce the PDF

The only executable code currently in this repository is documentation and design generation. Use Python 3.10 or later:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r docs/requirements.txt
.venv/bin/python docs/render_plan.py
```

Outputs: `output/pdf/presence-hackathon-plan.pdf` and the design SVG. The PDF includes the critical review, plan, implementation specification, rendered C4 views and source register. `docs/architecture.json` supplies both Mermaid and PDF diagrams; the renderer regenerates the Mermaid blocks automatically. Hand-edited sequence views remain in `docs/architecture.md`.

## Evaluation status

Planning version 2 was critically reviewed. The PDF is rendered and visually inspected before publication; documentation checks verify graph endpoints, shared diagram generation, local links and required content. No application tests, model benchmarks, live email round trips, hotel integrations or customer interviews have run. The next build gate is a real email round trip plus model/harness and job-restart checks, followed by the styled shell and connected flow.

## License and attribution

Original project code and documentation are provided under the [MIT license](LICENSE). The recovered Adobe challenge brief and linked third-party material retain their respective ownership and terms; their inclusion is not a claim of authorship or Adobe affiliation.
