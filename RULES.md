# Implemented solo rules

This document specifies the current RELIC solo subset. It is not a claim of complete tournament-style timing support.

## Decks and victory

- Start at 8,000 HP with five cards drawn from a shuffled Main Deck.
- Main Deck: 40–60 non-Fusion cards. Extra Deck: up to 15 Fusion cards. At most three copies of one ID across both decks; the player must own every copy.
- Win by reducing the opponent to zero HP or when the opponent is required to draw from an empty deck. Further actions cannot change a finished match.
- There is no maximum HP cap and currently no hand-size limit or free manual discard. Discard/hand-limit mechanics are still pending.

## Turn sequence

Draw and Standby are automatic, followed by Main 1 → Battle → Main 2 → End. The first player skips the first draw and Battle Phase. Each individual player's turn has a unique turn number. Ending a turn draws one card for the next player and resets that player's summon and attack/position allowances.

Main phases permit Normal Summon/Set, setting spells/traps, normal spell activation, Fusion and legal position changes. Attack actions are legal only during the active player's Battle Phase. Temporary ATK bonuses expire at the end of the turn in which they were applied.

## Monsters and battle

- One Normal Summon or Set per turn. Levels 1–4 need no tribute; 5–6 need one; 7+ need two. The current solo interface automatically tributes the lowest current-ATK monsters. Tributes are sent to the graveyard, not destroyed.
- Summon face-up in Attack Position or Set face-down in Defense Position. Five monster zones per player. Fusion and revival are Special Summons and do not consume the Normal Summon.
- Normal Summon effects trigger only on a face-up Normal Summon; they do not trigger on revival or a Flip Summon.
- A surviving monster may change position once per owner turn, during a Main Phase, provided it was not placed this turn and has not attacked. A set monster may Flip Summon into Attack Position under the same restrictions.
- Each Attack Position monster may attack once per owner turn. Direct attacks require an empty opposing monster field.
- Against Attack Position: compare current ATK, destroy the weaker monster and inflict the difference on its controller. Equal ATK destroys both without battle damage.
- Against Defense Position: compare current ATK with DEF. Higher ATK destroys the defender without damage to its controller; lower ATK inflicts the difference on the attacker without destroying it. Equal values destroy neither. A face-down defender flips face-up before calculation.

## Spells, traps and effects

- All current spells are normal spells, usable from hand or a set zone during the controller's Main Phase. Setting uses one of five spell/trap zones; a spell activated directly from hand resolves to the graveyard.
- Invalid activations retain their cards. Buff spells target the highest-current-ATK friendly Attack Position monster. Shatterspell targets the highest-current-ATK face-up enemy with at most 1,600 ATK. Returning Echo revives the most recently buried Level 4-or-lower non-Fusion monster in Defense Position.
- Defensive traps automatically respond to an enemy attack declaration from the turn after they were set. Zone order determines which eligible trap responds. There is no optional response or player-controlled chain yet.
- Negation/destruction traps stop that attack. Final Stand prevents the defending player's battle damage, including direct attacks. Guardian Bond applies only to a defending Defense Position monster and grants 500 DEF for that battle. Ember Rebuke damages the attacker before continuing combat, unless that damage ends the duel.
- Destroy-triggered healing resolves immediately in this solo subset. Full simultaneous-trigger ordering is pending.
- Current cards have no HP activation costs or discard costs. Their effect strings refer to reusable handlers in the engine; future costs need validation before cards/materials are consumed.

## Traditional Fusion

Activate Relic Fusion and explicitly select a legal Fusion from the Extra Deck. Its exact named materials must exist in the controller's hand or face-up monster zones. Materials and the spell are sent to the graveyard; the Fusion leaves the Extra Deck and enters an available monster zone in Attack Position. Consuming a field material may free that zone. A material instance cannot be used twice. Face-down monsters are not eligible materials in this subset.

## Known limits

Automatic targets, tributes and trap timing are deliberate boundaries of the current solo engine. Full chains, responses, spell speeds, additional card categories, continuous effects, discard/hand-limit rules and multiplayer authority remain on the development queue. No newer summoning systems or mana are used.
