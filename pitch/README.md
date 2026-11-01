# Prism pitch — Version 2 (working)

Open `index.html` directly in a browser, or serve this folder:

```sh
python3 -m http.server 4173
```

Then visit http://localhost:4173.

## Deck versions

- **Version 1 — Frozen:** `decks/v1/index.html`. A self-contained snapshot with its own CSS, JavaScript and assets. Leave this folder unchanged; `SHA256SUMS.json` records the snapshot.
- **Version 2 — Working:** `index.html`, `style.css`, `deck.js` and `assets/` in this folder. Uses the revised ecosystem → business → Krafft Basel hotel-manager role-play → Prism storyline. Make future changes here.
- Hover the upper-right corner and use the deck selector to switch. It is also available on the black opening slide and via keyboard focus. Switching opens the chosen deck at its beginning.

Version 2 uses dark backgrounds throughout, with restrained violet accents and muted green/red outcomes in the journey comparison.

## Presenting

- Arrow keys, Space or the next-arrow button: next beat. Clicking the slide canvas does not advance. The first slide is fully black. Slide 3 builds the five ecosystem categories in sequence. Slide 5 reveals the agent-led journey on the next beat.
- Left arrow: previous beat.
- F: fullscreen. H: hide or show controls.
- N: presenter notes, slide time budgets and rehearsal timer. Notes are hidden by default.
- O: slide overview. Home / End: first / last slide.
- Escape: close notes or overview.
- Touch: swipe to navigate.

The planned slide budgets total 186 seconds, including a 60-second live demo; this is 6 seconds over the three-minute rehearsal target. Slides advance manually. The rehearsal timer runs independently.

Slide 10 is a holding slide for the actual live demo. Version 2 uses the original dark Prism reveal on slide 8; both original reveal options remain in Version 1.

## Story and claims

Slide 6 follows the agent-led journey with “More efficient markets. Relationships become auctions.” The offer comparison is a metaphor for repeated competition, not a claim of a literal auction protocol or price-only selection.

Slide 9 uses a Krafft Basel hotel-manager role-play with Maxus and the supplied portrait in `assets/maxus.jpg`. Keep the role-play context in the presenter notes. The visible job title is “Hotel manager · Basel” for the scenario. Maxus is a fictional hotel-manager persona; no actual Krafft management role, partnership or claim about its internal technical team is implied. Slide 11 recaps the website-to-branded-AI journey. Slide 12 shows the implemented software factory: website evidence → experience selection → independent planning/review → template-based source generation and Docker checks → MCP tools and branded apps. The lower rail separates the Vercel control plane, local source worker and public configured MCP runtime.

Slide 3 is an illustrative ecosystem of 14 companies in five capability groups. Each company has an official local site icon, a short description and a clickable primary source. Tile areas do not encode market size. Some companies also serve merchants and brands; broader agent infrastructure is labelled separately. See `startup-sources.md` and `assets/logos/sources.json`.

“Yesterday / Agentic reality” contrasts a direct storefront journey with an agent-led journey available now. It does not mean all hotel bookings have already shifted to agents.

The BCG statistic is: losing the customer relationship is retailers' most common concern, cited by 91% of respondents. Source: [BCG, October 21, 2026](https://www.bcg.com/publications/2026/retailers-win-ai-shopping-agents). The study surveyed 50 of the top 300 global retailers and 100 top global brands. This validates the concern, not Prism's effectiveness. Detailed context is in the presenter notes.

Platform support, deployment and publishing requirements vary. The closing tagline expresses the cross-platform vision. Demonstrate and describe actual supported integrations accurately; generated packages, previews and deployed apps are different outputs. Creation does not guarantee invocation, discovery or loyalty improvements.

## Files

- `index.html`: editable slide copy, notes and timings.
- `style.css`: layout, typography and animations.
- `deck.js`: navigation, fragments, overview and timer.
- `assets/`: retained generated imagery, BCG attribution logo and locally stored official company icons. The diagrams are SVG/CSS; `maxus.jpg` is the supplied portrait.
- `image-prompts.json`: prompts for the previously generated raster imagery.

Version 2 has 13 slides, including the black opening; Version 1 retains its 13 slides. All slides and image assets work locally. Google Fonts are optional; Avenir Next and local sans-serif fonts provide fallbacks if offline. No build or package installation is required.

The specific “how to win hackathons” reference deck was not provided or found in this workspace. This version follows the agreed visual storyboard and minimal-copy direction.

The BCG logo is an official SVG extracted from the source article’s logo symbol, stored locally for offline attribution. Navigation stays hidden until the upper-right corner is hovered or its controls receive keyboard focus.

## Active hotel demonstration

The current Version 2 case is Krafft Basel, https://www.krafftbasel.ch/en/. Maxus plays a busy hotel manager who wants to keep the guest relationship without building custom integrations for each assistant. This is a scenario, not a claim about Krafft’s actual staffing or a partnership.

Demo sequence: enter the hotel URL in https://prism.mvps.ch → select rooms, demo reservation and guest updates → open the prepared hotel app → filter two guests and CHF250 per night → review a city-room quote → record a no-charge synthetic reservation → save local-tip interest.

The hotel integration is deployed at https://krafft.prism.mvps.ch/mcp (browser: /widget). The already verified configured hotel runtime remains available at https://prism.mvps.ch/apps/62d9b46320cf841b120e5f35fea685a9694486df/mcp. Room categories, branding and photographs are researched from the official hotel site. Rates, capacity, inventory, quotes and reservations are demo data. Updates are pull-based; no actual room reservation, payment or background push is claimed.

Frozen Version 1 is retained unchanged as an archive. The BCG slide remains explicitly a retailer study, not hotel-specific evidence.

[Hotel rehearsal and fallback script →](demo-script.md)
