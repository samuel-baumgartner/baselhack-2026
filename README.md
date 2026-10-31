# Presence - BaselHack 2026

Research, pitch and architecture for Adobe's **The Post-Website Business** challenge. Planning only: application implementation has not started.

> Your next customer is an agent. Your business should be ready.

Presence proposes a business-controlled commerce layer for independent hotels: publish approved facts and capabilities, handle agent requests through the merchant's existing inbox, and reconnect with customers through explicit subscriptions. The prototype scope is one fictional Basel hotel and three demo moments: **publish, transact, reconnect**.

The team reports that ideation began on **30 October 2026 at 20:30 Europe/Zurich**. The [decision log](docs/decision-log.md) preserves that timeline and the reasons behind the scope. Git history records the actual commits.

## What exists

- [Complete plan](docs/plan.md): preserved concept, evidence, market sizing, seven-slide / three-minute pitch, demo storyboard, milestones, stack, API and benchmark design.
- [Architecture](docs/architecture.md): editable C4 context, container and component diagrams, plus asynchronous booking sequence.
- [Sources](docs/sources.md): primary sources and evidence limitations.
- [Challenge brief](docs/challenge-brief.md): recovered challenge content, without participant/contact data.
- [PDF](output/pdf/presence-hackathon-plan.pdf): shareable plan including rendered architecture diagrams and source register.

Generated on 31 October 2026. No measured prototype results or revenue uplift are claimed. Prices and financial scenarios are explicitly hypothetical.

## Proposed implementation

One shared Next.js/TypeScript application with Postgres, Vercel AI SDK/Gateway, Codex-backed onboarding, persistent workflow execution and Resend. Customer onboarding produces versioned configuration, not customer-specific applications. Docker Compose is the intended local packaging. These are architecture decisions, not installed or tested integrations.

## Reproduce the PDF

The only executable code currently in this repository is the documentation renderer. Use Python 3.10 or later:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r docs/requirements.txt
.venv/bin/python docs/render_plan.py
```

Output: `output/pdf/presence-hackathon-plan.pdf`. Source content lives in `docs/plan.md`, `docs/sources.md` and `docs/challenge-brief.md`; the renderer draws the three C4 views as vectors. The editable Mermaid architecture and sequence are in `docs/architecture.md`.

## Evaluation status

The PDF was generated, its pages rendered for visual inspection, and its key sections, seven-slide outline and source links checked. No application tests, model benchmarks, live email round trips, hotel integrations or customer interviews have run. The next milestone is pitch and demo alignment, followed by the integration checks documented in the plan.

## License and attribution

Original project code and documentation are provided under the [MIT license](LICENSE). The recovered Adobe challenge brief and linked third-party material retain their respective ownership and terms; their inclusion is not a claim of authorship or Adobe affiliation.
