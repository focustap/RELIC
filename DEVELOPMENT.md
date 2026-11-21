# RELIC implementation record

## Audit — 20 November 2026

Source: `focustap/RELIC`, existing master queue: https://github.com/focustap/RELIC/issues/1.
Preserve that queue's order. The checkout initially contained no files or remote; the existing `main` was fetched before editing.

The application is dependency-free HTML/CSS/classic JavaScript, deployed directly from the repository root to GitHub Pages. `cards.js` defines 53 original cards (30 monsters, 11 spells, 7 traps, 5 fusions); `starters.js` supplies five valid 40-card decks. `app.js` contains routing, local persistence, purchases, deck editing, rules and AI in one closure. `styles.css`, `effects.css` and the SVG card back are usable foundations. The Actions workflow runs Node tests. There is no backend, authentication, online transport, build pipeline, illustrated card asset directory, or 500-card roster.

Existing tests: 18 pass, four TODOs. The tests called browser smoke tests use a DOM stub, not an actual browser. They do not verify rendering or complete matches.

Preserve: catalogue IDs and save key, starters, pack pricing, local collection, static deployment, card backs and existing animations. Repair: rules coupled to DOM, missing engine action guards, shared round counter for both turns (trap maturity), buff lifetime, position changes after attacking, AI suicidal attacks and knowledge of face-down stats, uncaught stale action clicks, silent save failures and destructive starter replacement. Current loss reward is 2 Gold; the new brief requires 10 for a completed standard duel.

## Ordered implementation

1. Separate and validate the existing solo rules, preserve all current effects and five starters. Add deterministic engine regression tests and full-match simulations. Keep the documented automatic trap response subset explicit; full player-controlled chains remain pending.
2. Verify branded hidden cards, then generate standalone illustrations for the existing catalogue. Save stable ID filenames, connect renderer, test every present asset, record remaining missing art honestly.
3. Improve existing summon/spell/trap/fusion and combat feedback, reduced motion, board clarity and responsive layout.
4. Complete collection/deck persistence and economy reliability with browser verification.
5. Continue the master queue: authored 500-card expansion, matchup balance, full chains, secure multiplayer and deployment. Do not inflate the roster or claim online functionality without a server.

## Verification and outstanding work

Verified locally in this milestone:

- Rules moved to `engine.js`; browser controller only requests actions and renders state. Illegal timing, same-turn trap maturity, buff expiration, revival triggers, position locks and direct-damage shielding have regression coverage.
- Five starters preserved. 100 seeded AI-vs-AI matches (four seeds per starter pairing) all finish with conserved card totals. This does not establish competitive balance.
- 53 distinct illustrations generated with the built-in image tool, reviewed on contact sheets, optimized to 768×768 WebP, and linked by stable card ID. All monster, spell, trap and Fusion images exist. Exact prompts and asset hashes are recorded in `artwork/`.
- Existing branded backs retained; art-backed main menu, collection, starter selector and deck thumbnails. Programmatic frame/text/rarity/stats; elemental activation, draw, attack, HP, fusion-material and result effects; reduced-motion/performance options.
- Named deck slots, automatic saving, rename/copy/switch, search/type/element filters, level/rarity sort, export/import, recovery copies and stale-tab detection. Prior save key retained.
- Local purchases validate supported sizes/prices, preserve existing drop rates and grant inventory on the same save as payment. Completed duels award 10 Gold exactly once per in-memory match. No online currency or anti-cheat claim.
- 39 passing Node tests and three explicit TODOs; 14 Chromium desktop/phone cases, including all image decodes, save export/restore, singles/deck copy limits and four complete matches driven through UI actions. Visual review includes desktop/phone home and arena. `npm run build` produces a static site with all assets (9.33 MiB of illustrations).

Known remaining work, in the original queue's order:

1. Finish full local rules: player-controlled chains/priority, explicit tribute and effect targeting, discard/hand limits and future effect costs. Trap timing currently uses the documented automatic solo subset. Further animation refinement and physical-device/other-browser QA remain.
2. Author, illustrate and balance 447+ additional cards; add broader archetype effects and matchup balance evidence. Do not inflate the roster with renamed generated copies. The current 53-card set is not a completed 500-card milestone.
3. Keep local economy distinct from any future authenticated wallet; server-side replay/race prevention is still needed for online rewards.
4. Build and deploy an authoritative backend with accounts, independent inventory/wallet storage, private matches, validated moves, disconnect/reconnect, timeouts and idempotent settlement. Share `engine.js` with the server but send clients only public state. Hosting/secrets are not configured; no online play exists in this branch.

The remote master issue has not been marked complete. No deployment or merge is implied by these local checks.

## Arena and automatic phases — 21 November 2026

User steering: match the spatial composition of the supplied card-game reference and advance turn phases automatically. Preserved the 53-card roster, original illustrations, existing rules/economy and saved decks.

- Replaced the scrolling match dashboard with one full-screen arena: original mossy limestone environment, programmatic stone zones, player/opponent HP panels in opposite corners, fanned hand, side deck/grave/extra piles and a phase dial/phase track. Desktop, phone portrait and phone landscape layouts are supported. Cards and UI are independent of the generated environment bitmap.
- Added explicit staged Draw/Standby/End, legal-action-aware automatic progression, per-action AI pacing and contextual controls for declining remaining optional actions. The scheduler pauses for inspection/navigation and cancels old callbacks on restart or match completion. It never auto-selects player actions or attacks, and has no timeout that forfeits a player decision.
- Added regression tests for first-turn skips, exact draw counts, phase order, holding at legal decisions, automatic battle completion, terminal guards, paced AI, pause/resume and restart behavior. Complete Ember/Nightfall browser matches exercise the new turn flow. Existing 500-card/chain/multiplayer TODOs remain pending.
- The new original environment and its exact built-in image generation prompt are stored in `public/assets/arena/` and `artwork/arena-prompt.json`; build validation checks both CSS asset paths and the background dimensions/format.
- Verification: 45 passing Node tests, three pre-existing TODOs, 20 passing desktop/phone Chromium cases, 125 complete engine simulations and a successful static build. Additional visual captures checked 1440×900 desktop, 768×1024 tablet portrait, 390×844 phone portrait and 844×390 phone landscape. Console checks in the captured matches reported no errors. This remains viewport QA, not physical-device certification.
