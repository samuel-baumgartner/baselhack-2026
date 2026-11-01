# Krafft Basel — rehearsal

The active case is a hotel. Maxus plays a hotel manager, not the actual owner/manager of Krafft Basel. No partner relationship or claim about the real hotel’s internal technology team is implied.

## Links

- Factory: https://prism.mvps.ch
- Official input: https://www.krafftbasel.ch/en/
- Prepared factory build: https://prism.mvps.ch/build/62d9b46320cf841b120e5f35fea685a9694486df
- Standalone hotel browser: https://krafft.prism.mvps.ch/widget
- Standalone MCP: https://krafft.prism.mvps.ch/mcp
- Source factory output, local/Tailscale only: http://100.98.187.105:3204

## Sixty-second demo

1. Paste the official hotel URL. Show the recommended room discovery, demo reservation and guest updates flows. Select all three.
2. If a fresh agent build takes too long, say “Here is a version we prepared earlier” and open the prepared build. Do not describe a prebuilt result as an instantaneous fresh build.
3. Open the hotel app. Set two adults, CHF250 nightly budget and any view. The prepared category is Double Room City, synthetic CHF220 per night.
4. Review the stay. For the default two nights, show CHF440 and the dates explicitly.
5. Confirm the demo reservation. Show the no-charge receipt and persistent reference. No room is actually booked.
6. Open During your stay and save local-tip interest. These are pull-based saved preferences; no background notification is sent.

## Natural language, if the native assistant is already connected

Add the standalone MCP endpoint through the assistant’s custom integration settings, with no authentication for this synthetic demo. Account eligibility/approval and native rendering must be checked before a live presentation; protocol tests alone do not prove that the assistant’s UI works.

Initial prompt:

> Use only the Krafft Basel app. Show rooms for two adults under CHF250 per night, using the app’s default demo dates. Keep this same stay session for every step. Show its embedded interface and tell me the number of nights and total. Do not search the web or make a reservation yet.

Then:

> Could I have a Rhine view if my budget is CHF300 per night? Update the same stay session.

Then:

> Show a reviewed demo quote for the Double Room River. Do not confirm it yet.

Confirm using the visible app button only after showing the date/total/no-charge messaging. If the embedded host fails, switch openly to the actual browser app and distinguish that from a native assistant test. Never replace a failed view with a claim that the view worked.

## Meaning of the architecture slide

The factory generates merchant introduction/action TSX and CSS around tested domain templates. It compiles and tests source locally in isolated Docker. The public factory-configured endpoint and standalone deployed hotel app run tested template code with Neon sessions; they are distinct from the independently generated local source output. Creation of a package is not installation or discovery inside a personal assistant.

Hotel categories/photographs/branding are researched from its official site. Rates, occupancies, availability, quotes and reservations are simulated. The BCG slide describes retailer research and is not a hotel survey.
