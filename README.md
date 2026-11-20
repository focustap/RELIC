# RELIC — Forge Your Legend

An original dark-fantasy monster-dueling game. The current release is a playable **offline alpha**, not the completed 500-card or online product.

## Play and develop

The production client remains plain HTML, CSS and JavaScript with no runtime dependencies. Open `index.html`, or use the local server:

```sh
npm ci
npm start
```

Open `http://127.0.0.1:4173/RELIC/`. Node 20+ is required for development tools. Select a starter in Deck Builder, then enter Duel Arena. The five starters are free to try and switching preserves previously saved decks.

## Implemented in this milestone

- 53 original cards with **53 distinct, generated standalone illustrations**, including monsters, spells, traps and all five fusions. Card frames, names, stars, effects, rarity and statistics are rendered by code.
- Original dark-fantasy presentation, illustrated starter choices, animated summon/set/activation/fusion/attack feedback, HP feedback, individual pack reveals and victory/defeat banners. Reduced-motion and low-effects options.
- A DOM-independent solo engine with legal action checks, tribute summons, battle, destruction, basic reusable effects, automatic defensive trap responses, named-material fusion, turns, HP and deck-out.
- Five usable 40-card starters and an AI that considers public board strength, avoids known losing attacks, sets traps, uses effects and fuses. It does not inspect face-down enemy statistics when choosing attacks.
- Collection search, type/element filters, level/rarity sorting, full illustration inspection, owned-copy validation and up to 30 named saved decks.
- Existing local saves migrate under the same save key. Saves retain a recovery backup; damaged JSON is preserved; failed writes and conflicting browser tabs are reported. Export/restore is available in Player Profile.
- Functional profile and settings pages. The online page explicitly reports that online play is unavailable.

## Rules and economy

Both players start with **8,000 HP**. There is no mana. Decks have 40–60 Main Deck cards, up to 15 Fusion cards in the Extra Deck, and at most three copies per ID. See [RULES.md](RULES.md) for the exact implemented solo rules and timing limitations.

Completed local duels, including defeats and surrender, award **10 Gold** once per match. Abandoning/restarting a match awards nothing. The daily cache awards 10 Gold once per local calendar day.

| Purchase | Cards | Gold | Gold per card |
| --- | ---: | ---: | ---: |
| Standard | 5 | 10 | 2.00 |
| Bundle | 12 | 22 | 1.83 |
| Large bundle | 25 | 40 | 1.60 |

For every complete group of five: three Common slots; one slot is 85% Uncommon / 15% Rare; one slot is 88% Rare / 12% Epic. Remaining bundle slots are Common. Selection is uniform within each rarity, with replacement. Duplicates are possible. Common singles cost 4 Gold; Uncommon singles cost 8 Gold, available until three copies are owned.

**Offline saves are user-editable and have no online value.** These safeguards prevent accidental loss and duplicate settlement within this client; they are not anti-cheat or an online wallet. Gold has no real-money value, purchase, withdrawal or redemption.

## Verification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run review:art
```

`npm test` covers rules, every existing spell/trap family, storage recovery/conflicts, deck validation and 100 seeded complete matches across all 25 starter pairings. Three explicit TODOs represent unfinished expansion, full chains and multiplayer.

Playwright uses Chromium at desktop (1440×1000) and phone (390×844) sizes. It checks all routes, named deck persistence, purchases, individual reveals, all 53 decoded illustrations, settings, and complete Ember/Nightfall matches driven through actual interface actions. These are browser viewport checks, not physical-device or Safari/Firefox certification. Screenshots and review sheets are written to `test-results/`.

`build` validates JavaScript, checks that every artwork file is a distinct 768×768 WebP, writes its hash to `artwork/manifest.json`, and assembles the static `dist/` directory. Artwork totals approximately 9.33 MiB. Production uses lazy-loaded WebP images; no credentials or image service connection is needed to play.

## Artwork provenance

The built-in `image_gen` tool generated one original illustration per card. Exact prompts are recorded in [artwork/prompts.json](artwork/prompts.json); files are stored under `public/assets/cards/<stable-card-id>.webp`. Original generation outputs were retained outside the repository; optimized game images are committed. No frame, name, statistics, stars or game UI are baked into the card artwork. Contact sheets were visually reviewed for matching subjects and unwanted text or borders.

## GitHub Pages

Existing deployment remains compatible: Settings → Pages → Deploy from a branch → `main` → `/ (root)`. Do not change the source merely to run tests. All client script and artwork URLs are relative, with hash navigation, so the `/RELIC/` project prefix works. `dist/` is also a complete static artifact if a separate deployment pipeline is desired.

The Actions workflow runs rules/storage checks, validates the static build and runs the desktop/phone browser suite. It does **not** deploy this development branch.

## Remaining roadmap

Follow the existing [master development queue](https://github.com/focustap/RELIC/issues/1), with the audit and verified status in [DEVELOPMENT.md](DEVELOPMENT.md). Do not mark a milestone complete just because its UI is visible.

- Player-controlled chains, priority, Spell Speeds, optional trap timing, explicit tribute/target selection, discard costs/hand limits and the full continuous/equip/field rules framework.
- At least **500 genuinely authored, illustrated and balanced cards**. The roster is currently 53; simulation completion is not evidence of matchup balance.
- Further cinematic animation, difficulty options, extensive playtesting and physical-device/browser QA.
- Authentication, server-backed inventory/wallet, authoritative private 1v1, reconnection, settlement and security/load testing. GitHub Pages cannot host these services. Share the pure engine with a separate server, validate all client actions there and keep online wallet state independent of local saves. No online match or wager is implemented here.
