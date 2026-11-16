// Original First Edition card catalogue. No outside IP, assets, or dependencies.
const MON = (id,name,level,atk,def,rarity,icon,element,flavor,effect="") => ({id,name,type:"monster",level,atk,def,rarity,icon,element,description:flavor,effect});
const SPELL = (id,name,rarity,icon,description,effect) => ({id,name,type:"spell",rarity,icon,element:"Arcane",description,effect});
const TRAP = (id,name,rarity,icon,description,effect) => ({id,name,type:"trap",rarity,icon,element:"Shadow",description,effect});
const FUSION = (id,name,level,atk,def,rarity,icon,element,materials,description,effect="") => ({id,name,type:"fusion",level,atk,def,rarity,icon,element,materials,description,effect});
const RELIC_CARDS = [
  MON("ember-squire","Ember Squire",4,1700,1100,"common","⚔️","Fire","A steadfast warrior forged in the first flame."),
  MON("mossbound-guard","Mossbound Guard",4,1200,1900,"common","🌿","Earth","Its bark is as patient as the oldest forest.","heal-on-destroy"),
  MON("tide-runner","Tide Runner",4,1600,1200,"common","🌊","Water","No current can outpace its silver fins."),
  MON("dusk-scout","Dusk Scout",3,1400,1000,"common","🦉","Shadow","Sees the danger before it arrives."),
  MON("stonebound-golem","Stonebound Golem",4,1800,1400,"common","🪨","Earth","An ancient guardian awakened by forgotten words."),
  MON("arcane-apprentice","Arcane Apprentice",3,1100,1000,"common","🧙","Arcane","When Normal Summoned: draw 1 card.","draw-on-summon"),
  MON("flame-lynx","Flame Lynx",4,1750,900,"common","🔥","Fire","A blazing hunter of the volcanic wilds."),
  MON("glade-stag","Glade Stag",4,1500,1700,"common","🦌","Earth","A noble protector of the glimmering glades."),
  MON("dune-ranger","Dune Ranger",4,1650,1300,"common","🏹","Earth","A wandering archer of the endless sands."),
  MON("mist-sprite","Mist Sprite",2,700,1200,"common","☁️","Water","A curious spark that follows travelers."),
  MON("ironjack","Ironjack Soldier",4,1850,1000,"common","🤖","Metal","Simple steel. Unbreakable courage."),
  MON("frostcap","Frostcap Imp",2,800,1100,"common","❄️","Water","A prankster with a colder touch."),
  MON("thorn-hound","Thorn Hound",3,1350,1200,"common","🐺","Earth","Its howl ripples through ancient groves."),
  MON("sunscale","Sunscale Drake",4,1800,1200,"common","🐉","Fire","Young dragon, fierce heart."),
  MON("opal-wisp","Opal Wisp",1,300,800,"common","✨","Arcane","The first light of a newborn relic."),
  MON("blade-dancer","Blade Dancer",4,1650,1450,"uncommon","🗡️","Metal","Swift strikes hide a careful strategy."),
  MON("rune-medic","Rune Medic",3,1100,1500,"uncommon","💠","Arcane","When Normal Summoned: gain 400 LP.","heal-on-summon"),
  MON("river-serpent","River Serpent",4,1900,1000,"uncommon","🐍","Water","The river bends where it travels."),
  MON("moon-archer","Moon Archer",4,1600,1500,"uncommon","🌙","Shadow","A single arrow under the crescent moon."),
  MON("ashen-knight","Ashen Knight",5,2200,1800,"uncommon","♞","Fire","Tribute 1 monster to summon this wandering champion."),
  MON("root-giant","Root Giant",6,2400,2100,"uncommon","🌳","Earth","A titan that moves only for its home."),
  MON("glass-mage","Glass Mage",4,1400,1600,"uncommon","🔮","Arcane","Can see many futures, but never all of them."),
  MON("thunder-kestrel","Thunder Kestrel",4,1800,1150,"uncommon","⚡","Air","A storm carried on feathered wings."),
  MON("nightblade","Nightblade",4,1850,900,"uncommon","🦇","Shadow","A blade revealed only in the final moment."),
  MON("verdant-templar","Verdant Templar",5,2250,2000,"rare","🛡️","Earth","A champion sworn to preserve the living world."),
  MON("emberlord","Emberlord",7,2700,2100,"rare","🌋","Fire","The crown of cinders demands two tributes."),
  MON("abyss-whale","Abyss Whale",7,2600,2500,"rare","🐋","Water","A monarch beneath lightless seas."),
  MON("skybreaker","Skybreaker Gryphon",6,2350,2000,"rare","🦅","Air","The last roar before the thunder."),
  MON("relic-sentinel","Relic Sentinel",8,2850,2500,"epic","🗿","Metal","The ancient vault's final defender."),
  MON("starweaver","Starweaver",7,2650,2350,"epic","🌠","Arcane","Stars obey its patient hands."),
  SPELL("relic-fusion","Relic Fusion","common","✧","Combine the exact named materials from your hand or field to summon a Fusion Monster from your Extra Deck.","fusion"),
  SPELL("mending-light","Mending Light","common","💛","Gain 800 Life Points.","heal800"),
  SPELL("spark-bolt","Spark Bolt","common","⚡","Deal 500 damage to your opponent.","burn500"),
  SPELL("runic-blade","Runic Blade","common","🗡️","Give one of your Attack Position monsters +400 ATK until this turn ends.","buff400"),
  SPELL("arcane-insight","Arcane Insight","common","📜","Draw 1 card.","draw1"),
  SPELL("quiet-rain","Quiet Rain","common","💧","Gain 500 Life Points.","heal500"),
  SPELL("ancient-map","Ancient Map","uncommon","🗺️","Draw 1 card. Then gain 200 LP.","insight"),
  SPELL("shatterspell","Shatterspell","uncommon","💥","Destroy one enemy face-up monster with 1600 or less ATK.","shatter"),
  SPELL("returning-echo","Returning Echo","uncommon","🔁","Special Summon one Level 4 or lower monster from your Graveyard in Defense Position.","revive"),
  SPELL("flame-pulse","Flame Pulse","rare","☄️","Deal 700 damage to your opponent.","burn700"),
  SPELL("solar-aegis","Solar Aegis","rare","☀️","Give a monster +600 ATK until the end of this turn.","buff600"),
  TRAP("fog-screen","Fog Screen","common","🌫️","When an opponent attacks: negate that attack.","negate-attack"),
  TRAP("ambush-snare","Ambush Snare","common","🪤","When attacked: destroy the attacker if it has 1800 ATK or less.","snare"),
  TRAP("final-stand","Final Stand","common","🛡️","When attacked: reduce the battle damage you would take to 0.","shield"),
  TRAP("ember-rebuke","Ember Rebuke","common","🔥","When attacked: inflict 350 damage to your opponent, then continue the battle.","rebuke"),
  TRAP("guardian-bond","Guardian Bond","uncommon","🔗","When attacked: give your defending monster +500 DEF for this battle.","guard"),
  TRAP("nightfall-veil","Nightfall Veil","uncommon","🌑","When attacked: negate the attack and gain 300 LP.","veil"),
  TRAP("rune-collapse","Rune Collapse","rare","💢","When attacked: destroy an attacking monster with 2200 ATK or less.","collapse"),
  FUSION("emberstone-colossus","Emberstone Colossus",7,2650,2350,"rare","🌋","Fire",["ember-squire","stonebound-golem"],"Ember Squire + Stonebound Golem. Two wills become a mountain of flame."),
  FUSION("verdant-leviathan","Verdant Leviathan",7,2600,2550,"rare","🐲","Water",["tide-runner","mossbound-guard"],"Tide Runner + Mossbound Guard. The forest and the sea remember one another."),
  FUSION("sunfire-predator","Sunfire Predator",7,2800,1950,"epic","🦁","Fire",["flame-lynx","sunscale"],"Flame Lynx + Sunscale Drake. Fire given wings and fangs."),
  FUSION("lunar-knight","Lunar Knight",7,2700,2150,"epic","🌘","Shadow",["moon-archer","nightblade"],"Moon Archer + Nightblade. A perfect strike in complete darkness."),
  FUSION("warden-of-roots","Warden of Roots",8,2900,2800,"epic","🌲","Earth",["root-giant","glade-stag"],"Root Giant + Glade Stag. The forest itself takes a stand.")
];
const RELIC_BY_ID = Object.fromEntries(RELIC_CARDS.map(card=>[card.id,card]));
const STARTER_LIST = {
  "ember-squire":3,"mossbound-guard":3,"tide-runner":3,"dusk-scout":3,
  "stonebound-golem":3,"arcane-apprentice":3,"flame-lynx":2,
  "glade-stag":2,"dune-ranger":2,"relic-fusion":2,"mending-light":2,
  "spark-bolt":2,"runic-blade":2,"arcane-insight":1,"fog-screen":3,
  "ambush-snare":2,"final-stand":2
};
const STARTER_DECK = Object.entries(STARTER_LIST).flatMap(([id,count])=>Array(count).fill(id));
const STARTER_EXTRA = ["emberstone-colossus","verdant-leviathan"];
const RARITY_ORDER = ["common","uncommon","rare","epic"];
const SINGLE_PRICES = {common:30,uncommon:70,rare:140,epic:240};