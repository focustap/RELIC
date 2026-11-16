// Five original playstyles. Commanders identify a deck's featured champion;
// they do NOT occupy a new field zone or use a separate summon mechanic.
const RELIC_STARTERS = [
 {id:"ember",name:"Ember Vanguard",style:"Aggro",commander:"emberlord",
  description:"Fast pressure with flame creatures, direct-damage spells and explosive Fusion finishers.",
  extra:["emberstone-colossus","sunfire-predator"],
  picks:[["emberlord",1],["ember-squire",3],["flame-lynx",3],["sunscale",3],["ashen-knight",2],["thunder-kestrel",2],["dusk-scout",2],["ironjack",2],["stonebound-golem",2],["spark-bolt",3],["flame-pulse",1],["relic-fusion",3],["runic-blade",2],["fog-screen",2],["ember-rebuke",2],["ambush-snare",2],["arcane-insight",1],["mending-light",2]]},
 {id:"verdant",name:"Verdant Bastion",style:"Defense",commander:"verdant-templar",
  description:"Durable guardians, healing and traps that outlast aggressive opponents.",
  extra:["verdant-leviathan","warden-of-roots"],
  picks:[["verdant-templar",1],["mossbound-guard",3],["glade-stag",3],["stonebound-golem",3],["root-giant",2],["thorn-hound",3],["rune-medic",2],["tide-runner",2],["dune-ranger",2],["relic-fusion",2],["mending-light",3],["quiet-rain",2],["fog-screen",3],["guardian-bond",2],["final-stand",3],["ancient-map",2],["ambush-snare",2]]},
 {id:"tide",name:"Tidekeepers",style:"Control",commander:"abyss-whale",
  description:"Protect your life points, disrupt attacks and win after establishing strong sea creatures.",
  extra:["verdant-leviathan"],
  picks:[["abyss-whale",1],["tide-runner",3],["river-serpent",3],["mist-sprite",3],["frostcap",3],["mossbound-guard",3],["arcane-apprentice",2],["dusk-scout",2],["relic-fusion",2],["shatterspell",2],["quiet-rain",3],["arcane-insight",2],["mending-light",2],["fog-screen",3],["nightfall-veil",2],["final-stand",2],["ancient-map",2]]},
 {id:"astral",name:"Astral Archive",style:"Combo",commander:"starweaver",
  description:"Draw and filter cards, protect your combo pieces, then summon spellbound legends.",
  extra:["emberstone-colossus","verdant-leviathan"],
  picks:[["starweaver",1],["arcane-apprentice",3],["glass-mage",3],["opal-wisp",3],["stonebound-golem",3],["ember-squire",3],["tide-runner",3],["mossbound-guard",2],["rune-medic",2],["relic-fusion",3],["arcane-insight",3],["ancient-map",3],["returning-echo",2],["fog-screen",2],["mending-light",2],["spark-bolt",2]]},
 {id:"night",name:"Nightfall Syndicate",style:"Tempo / Fusion",commander:"lunar-knight",
  description:"Use precise strikes, hidden traps and a named-material shadow Fusion to swing the board.",
  extra:["lunar-knight"],
  picks:[["nightblade",3],["moon-archer",3],["dusk-scout",3],["blade-dancer",3],["ironjack",3],["flame-lynx",2],["thorn-hound",2],["sunscale",2],["arcane-apprentice",2],["relic-fusion",3],["runic-blade",2],["shatterspell",2],["fog-screen",2],["ambush-snare",3],["rune-collapse",1],["arcane-insight",2],["returning-echo",2]]}
];
for(const archetype of RELIC_STARTERS){
 archetype.deck=archetype.picks.flatMap(([id,n])=>Array(n).fill(id));
 if(archetype.deck.length!==40)throw new Error(archetype.name+" must have exactly 40 cards; found "+archetype.deck.length);
 for(const [id,n] of archetype.picks){if(!RELIC_BY_ID[id]||n>3)throw new Error("Invalid starter card "+id);}
 for(const id of archetype.extra){if(RELIC_BY_ID[id]?.type!=="fusion")throw new Error("Invalid starter fusion "+id);}
}