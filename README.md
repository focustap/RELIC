# RELIC ✧

**Forge Your Legend.** An original fantasy trading-card game website inspired by the strategy and pacing of classic monster-dueling games.

## Rule direction

- **No mana.** Duels use **8,000 starting Life Points (LP)**, with optional LP costs on specific effects.
- 40–60 Main Deck cards; up to 15 Fusion Monsters in the Extra Deck; maximum 3 copies of one card.
- Monster stars, ATK and DEF, Normal/Effect Monsters, Spells and Traps.
- 1 Normal Summon or Set per turn, including tributes for Level 5+ monsters.
- Traditional named-material Fusion through **Relic Fusion** only.
- No Xyz, Synchro, Link, Pendulum or Ritual systems.
- Core turn structure: Draw, Standby, Main 1, Battle, Main 2, End.
- The browser solo-duel AI is an **alpha rules subset**, not a fully tournament-accurate engine. Full reaction chains and advanced timing are planned.

## First Edition site

- Home, card shop, collection, deck builder, solo Duel Arena and rules.
- Original 53-card first-pass catalogue with rarity, star levels, types and preliminary effect balancing.
- Five selectable commander-themed starter decks: Ember Vanguard (aggro), Verdant Bastion (defense), Tidekeepers (control), Astral Archive (combo), Nightfall Syndicate (tempo/fusion).
- Custom RELIC card backs for hidden cards. First-pass placement and fusion animations respect reduced-motion settings.
- Cards currently display **placeholder icon artwork**; named illustrations for every card are still planned.
- Collection and gold are saved locally in the browser (temporary alpha only). A future server must own accounts and inventory.

## Gold economy (alpha)

- Free Duel vs AI: victory **+10 Gold**, defeat **+2 Gold**.
- Daily Gold cache: +10 Gold.
- Standard pack: **5 cards for 10 Gold**.
- Bigger packs: **12 for 22 Gold**, **25 for 40 Gold**, cheaper per card.
- Individual basic Commons and Uncommons available in the shop.
- **Gold has no real-money value, cannot be bought with real currency and cannot be redeemed for cash or prizes.** Online wagers, if added, must stay in a non-redeemable game-only economy and be handled securely by a server.

## Local development

No build step or dependencies are needed to run the website.

1. Open `index.html` in a browser (or use a simple static file server for best compatibility).
2. For automated checks, install Node.js 20+ and run `npm test`.
3. GitHub Actions runs the same tests on pushes and pull requests.

## Deploy with GitHub Pages

**Use `main` as the deployment source, not Actions.** The site is plain HTML, CSS and JavaScript and doesn't require a build.

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **`main`** and folder **`/ (root)`**, then **Save**.
4. GitHub Pages will publish the static site. Actions is used for **tests only**.

This setup is suitable for the solo browser prototype. **Real online 1v1, authentication, and authoritative Gold/wager balances cannot be securely hosted on GitHub Pages alone**; those features need a separate backend/service.

## Work queue

Follow the [master GitHub issue](https://github.com/focustap/RELIC/issues/1). Every checkbox must be supported by code and tests before being marked complete.

### Important not-yet-shipped items

- Full rules engine including player-controlled Chains, priority, Spell Speeds and advanced timing.
- Original monster illustrations and complete animation polish.
- 500+ unique balanced, playtested cards in rotation.
- Online 1v1, secure matchmaking and game-only wager settlement.
- Real-device/browser QA and production launch.
